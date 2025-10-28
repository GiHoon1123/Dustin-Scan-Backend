import { ChainClientService } from '@app/chain-client';
import {
  ChainBlockDto,
  ChainReceiptDto,
  ChainTransactionDto,
  hexToDecimal,
  hexToDecimalString,
} from '@app/common';
import { Account, Block, Transaction, TransactionReceipt } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Block Indexer Service
 *
 * 블록 데이터를 파싱하고 DB에 저장하는 서비스
 *
 * 주요 기능:
 * 1. Chain 블록 데이터 (Hex String) → DB 엔티티 (Decimal) 변환
 * 2. Block, Transaction 저장
 * 3. Account 잔액/nonce 업데이트
 * 4. 트랜잭션으로 원자성 보장 (전부 성공 or 전부 실패)
 */
@Injectable()
export class BlockIndexerService {
  private readonly logger = new Logger(BlockIndexerService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly chainClient: ChainClientService,
  ) {}

  /**
   * 블록 인덱싱 메인 로직
   *
   * 하나의 트랜잭션 안에서 모든 작업을 수행하여 원자성 보장
   * 어느 하나라도 실패하면 전체 롤백됨
   *
   * @param blockData - Chain에서 받은 블록 데이터 (Hex 포함)
   * @throws 파싱 또는 저장 중 에러 발생시 예외 던짐
   */
  async indexBlock(blockData: ChainBlockDto): Promise<void> {
    const blockNumber = hexToDecimal(blockData.number);

    this.logger.debug(`Starting to index block #${blockNumber}`);

    // 트랜잭션 시작: 모든 작업이 성공해야만 커밋됨
    await this.dataSource.transaction(async (manager) => {
      // 1. 블록 중복 체크
      const existingBlock = await manager.findOne(Block, {
        where: { hash: blockData.hash },
      });

      if (existingBlock) {
        this.logger.warn(`Block #${blockNumber} already indexed, skipping`);
        return;
      }

      // 2. 블록 엔티티 생성 및 저장
      const block = this.parseBlock(blockData);
      await manager.save(Block, block);
      this.logger.debug(`Saved block #${blockNumber}`);

      // 3. 트랜잭션들 저장, Receipt 조회 및 저장, 계정 업데이트
      for (const txData of blockData.transactions) {
        // 트랜잭션 저장
        const transaction = this.parseTransaction(txData, blockData);
        await manager.save(Transaction, transaction);

        // Receipt 조회 (Chain RPC 호출)
        const receiptData = await this.chainClient.getReceipt(txData.hash);

        if (receiptData) {
          // Receipt 저장
          const receipt = this.parseReceipt(receiptData);
          await manager.save(TransactionReceipt, receipt);

          // 계정 잔액 업데이트 (Receipt status에 따라)
          // status === 1 (0x1) 이면 성공, 0 (0x0) 이면 실패
          const status = hexToDecimal(receiptData.status);
          if (status === 1) {
            await this.updateAccounts(manager, txData);
          } else {
            // 실패한 트랜잭션은 잔액 변경 없음 (Gas도 없으므로 아무것도 안함)
            this.logger.debug(`Transaction ${txData.hash} failed, skipping balance update`);
          }
        } else {
          // Receipt가 없는 경우 (pending 상태일 수도 있지만, 블록에 포함되었으면 있어야 함)
          this.logger.warn(`No receipt found for transaction ${txData.hash}`);
          // Receipt 없어도 일단 계정 업데이트는 진행
          await this.updateAccounts(manager, txData);
        }
      }

      this.logger.debug(
        `Indexed block #${blockNumber} with ${blockData.transactions.length} transactions`,
      );
    });
  }

  /**
   * Chain 블록 데이터를 DB Block 엔티티로 변환
   *
   * Hex String → Decimal 변환 수행
   *
   * @param blockData - Chain 블록 데이터
   * @returns Block 엔티티
   */
  private parseBlock(blockData: ChainBlockDto): Block {
    const block = new Block();

    // Hex → Decimal 변환
    block.number = hexToDecimalString(blockData.number);
    block.timestamp = hexToDecimalString(blockData.timestamp);
    block.transactionCount = hexToDecimal(blockData.transactionCount);

    // 해시 및 문자열 필드
    block.hash = blockData.hash;
    block.parentHash = blockData.parentHash;
    block.proposer = blockData.proposer;
    block.stateRoot = blockData.stateRoot;
    block.transactionsRoot = blockData.transactionsRoot;
    block.receiptsRoot = blockData.receiptsRoot;

    // 원본 데이터 저장 (디버깅/추후 재처리용)
    block.raw = blockData;

    return block;
  }

  /**
   * Chain 트랜잭션 데이터를 DB Transaction 엔티티로 변환
   *
   * @param txData - Chain 트랜잭션 데이터
   * @param blockData - 이 트랜잭션이 포함된 블록 데이터
   * @returns Transaction 엔티티
   */
  private parseTransaction(txData: ChainTransactionDto, blockData: ChainBlockDto): Transaction {
    const transaction = new Transaction();

    // 트랜잭션 기본 정보
    transaction.hash = txData.hash;
    transaction.from = txData.from;
    transaction.to = txData.to;

    // Hex → Decimal 변환
    transaction.value = hexToDecimalString(txData.value);
    transaction.nonce = hexToDecimal(txData.nonce);
    transaction.timestamp = hexToDecimalString(txData.timestamp);

    // 블록 정보
    transaction.blockHash = blockData.hash;
    transaction.blockNumber = hexToDecimalString(blockData.number);

    // 원본 데이터 저장
    transaction.raw = txData;

    return transaction;
  }

  /**
   * Chain Receipt 데이터를 DB TransactionReceipt 엔티티로 변환
   *
   * @param receiptData - Chain Receipt 데이터
   * @returns TransactionReceipt 엔티티
   */
  private parseReceipt(receiptData: ChainReceiptDto): TransactionReceipt {
    const receipt = new TransactionReceipt();

    // Receipt 기본 정보
    receipt.transactionHash = receiptData.transactionHash;
    receipt.transactionIndex = hexToDecimal(receiptData.transactionIndex);
    receipt.blockHash = receiptData.blockHash;
    receipt.blockNumber = hexToDecimalString(receiptData.blockNumber);
    receipt.from = receiptData.from;
    receipt.to = receiptData.to;

    // 실행 상태 (Hex → Decimal: 0x0 → 0, 0x1 → 1)
    receipt.status = hexToDecimal(receiptData.status);

    // Gas 사용량 (Hex → Decimal String)
    receipt.gasUsed = hexToDecimalString(receiptData.gasUsed);
    receipt.cumulativeGasUsed = hexToDecimalString(receiptData.cumulativeGasUsed);

    // Contract 주소 (있으면)
    receipt.contractAddress = receiptData.contractAddress;

    // 이벤트 로그
    receipt.logs = receiptData.logs || [];
    receipt.logsBloom = receiptData.logsBloom;

    return receipt;
  }

  /**
   * 트랜잭션에 따라 계정 잔액 및 nonce 업데이트
   *
   * 처리 로직:
   * 1. from 계정: 잔액 차감, nonce 증가, txCount 증가
   * 2. to 계정: 잔액 증가, txCount 증가
   *
   * @param manager - TypeORM EntityManager (트랜잭션 내에서 실행)
   * @param txData - 트랜잭션 데이터
   */
  private async updateAccounts(manager: any, txData: ChainTransactionDto): Promise<void> {
    const value = BigInt(hexToDecimalString(txData.value));
    const nonce = hexToDecimal(txData.nonce);

    // from 계정 처리
    const fromAccount = await this.getOrCreateAccount(manager, txData.from);
    fromAccount.balance = (BigInt(fromAccount.balance) - value).toString();
    fromAccount.nonce = nonce + 1; // nonce는 다음 트랜잭션을 위해 1 증가
    fromAccount.txCount += 1;
    await manager.save(Account, fromAccount);

    // to 계정 처리
    const toAccount = await this.getOrCreateAccount(manager, txData.to);
    toAccount.balance = (BigInt(toAccount.balance) + value).toString();
    toAccount.txCount += 1;
    await manager.save(Account, toAccount);
  }

  /**
   * 계정 조회 또는 생성
   *
   * 계정이 없으면 새로 생성하고, 있으면 기존 계정 반환
   *
   * @param manager - TypeORM EntityManager
   * @param address - 계정 주소
   * @returns Account 엔티티
   */
  private async getOrCreateAccount(manager: any, address: string): Promise<Account> {
    let account = await manager.findOne(Account, { where: { address } });

    if (!account) {
      account = new Account();
      account.address = address;
      account.balance = '0';
      account.nonce = 0;
      account.txCount = 0;
      await manager.save(Account, account);
    }

    return account;
  }
}
