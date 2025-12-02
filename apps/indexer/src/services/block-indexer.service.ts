import { ChainClientService } from '@app/chain-client';
import {
  ChainBlockDto,
  ChainReceiptDto,
  ChainTransactionDto,
  hexToDecimal,
  hexToDecimalString,
} from '@app/common';
import { Block, Contract, Token, TokenTransfer, Transaction, TransactionReceipt } from '@app/database';
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
    const tokenExistsCache = new Map<string, boolean>();

    try {
      // 트랜잭션 시작: 모든 작업이 성공해야만 커밋됨
      // Isolation Level: READ COMMITTED (부분 커밋 방지)
      await this.dataSource.transaction(
        async (manager) => {
          // 1. 블록 중복 체크
          const existingBlock = await manager.findOne(Block, {
            where: { hash: blockData.hash },
          });

          if (existingBlock) {
            // 블록이 이미 있으면 하위 엔티티도 모두 있는지 확인
            // 일부만 저장된 경우를 대비해 하위 엔티티도 체크
            this.logger.warn(`Block #${blockNumber} already indexed, checking child entities...`);
            
            // 하위 엔티티가 모두 있는지 확인 (중복 저장 방지)
            for (const txData of blockData.transactions) {
              const existingTx = await manager.findOne(Transaction, {
                where: { hash: txData.hash },
              });

              if (!existingTx) {
                this.logger.warn(
                  `Block #${blockNumber} exists but transaction ${txData.hash} is missing, re-indexing...`,
                );
                // 하위 엔티티가 없으면 다시 저장 시도
                await this.saveBlockEntities(blockData, manager, tokenExistsCache);
                return;
              }

              // Receipt도 확인
              const receiptData = await this.chainClient.getReceipt(txData.hash);
              if (receiptData) {
                const existingReceipt = await manager.findOne(TransactionReceipt, {
                  where: { transactionHash: receiptData.transactionHash },
                });

                if (!existingReceipt) {
                  this.logger.warn(
                    `Block #${blockNumber} exists but receipt for ${txData.hash} is missing, re-indexing...`,
                  );
                  await this.saveBlockEntities(blockData, manager, tokenExistsCache);
                  return;
                }
              }
            }

            this.logger.debug(`Block #${blockNumber} and all child entities already indexed, skipping`);
            return;
          }

          // 2. 블록 및 하위 엔티티 저장
          await this.saveBlockEntities(blockData, manager, tokenExistsCache);
        },
      );
    } catch (error: any) {
      // 트랜잭션 에러 발생 시 로깅 및 재던지기
      this.logger.error(
        `Failed to index block #${blockNumber} (hash: ${blockData.hash}):`,
        error.message || error,
      );
      throw error; // 상위로 에러 전파 (Sync 서버가 재시도하도록)
    }
  }

  /**
   * 블록 및 하위 엔티티 저장 (중복 체크 포함, 원자적 저장 보장)
   *
   * 트랜잭션 내에서 모든 작업이 성공해야만 커밋됨
   * 하나라도 실패하면 전체 롤백됨
   *
   * @param blockData - Chain 블록 데이터
   * @param manager - TypeORM EntityManager
   * @param tokenExistsCache - 토큰 존재 여부 캐시
   */
  private async saveBlockEntities(
    blockData: ChainBlockDto,
    manager: any,
    tokenExistsCache: Map<string, boolean>,
  ): Promise<void> {
    const blockNumber = hexToDecimal(blockData.number);

    // 1. 블록 저장 (중복 체크는 상위에서 이미 함)
    const block = this.parseBlock(blockData);
    await manager.save(Block, block);

    // 2. 모든 트랜잭션 및 Receipt를 먼저 조회하고 엔티티 생성
    // (RPC 호출이 트랜잭션 외부에서 이루어지면 안 되므로, 트랜잭션 내에서 수행)
    const transactionsToSave: Transaction[] = [];
    const receiptsToSave: TransactionReceipt[] = [];
    const tokenTransfersToSave: TokenTransfer[] = [];
    const contractsToSave: Contract[] = [];

    for (const txData of blockData.transactions) {
      // Transaction 중복 체크
      const existingTx = await manager.findOne(Transaction, {
        where: { hash: txData.hash },
      });

      if (!existingTx) {
        const transaction = this.parseTransaction(txData, blockData);
        transactionsToSave.push(transaction);
      } else {
        this.logger.debug(`Transaction ${txData.hash} already exists, skipping`);
      }

      // Receipt 조회 (Chain RPC 호출) - 트랜잭션 내에서 수행
      const receiptData = await this.chainClient.getReceipt(txData.hash);

      if (receiptData) {
        // TransactionReceipt 중복 체크
        const existingReceipt = await manager.findOne(TransactionReceipt, {
          where: { transactionHash: receiptData.transactionHash },
        });

        if (!existingReceipt) {
          const receipt = this.parseReceipt(receiptData);
          receiptsToSave.push(receipt);
        } else {
          this.logger.debug(`Receipt for ${receiptData.transactionHash} already exists, skipping`);
        }

        // 토큰 Transfer 이벤트 파싱 (저장은 나중에)
        const transfers = await this.parseTokenTransfers(
          receiptData,
          blockData,
          manager,
          tokenExistsCache,
        );
        tokenTransfersToSave.push(...transfers);

        // 컨트랙트 배포 감지 및 파싱 (저장은 나중에)
        if (receiptData.contractAddress) {
          const contract = await this.parseContract(receiptData, blockData, txData, manager);
          if (contract) {
            contractsToSave.push(contract);
          }
        }
      } else {
        // Receipt가 없는 경우 (pending 상태일 수도 있지만, 블록에 포함되었으면 있어야 함)
        this.logger.warn(`No receipt found for transaction ${txData.hash}`);
      }
    }

    // 3. 모든 엔티티를 한 번에 저장 (원자적 보장)
    // 하나라도 실패하면 전체 롤백됨
    if (transactionsToSave.length > 0) {
      await manager.save(Transaction, transactionsToSave);
    }

    if (receiptsToSave.length > 0) {
      await manager.save(TransactionReceipt, receiptsToSave);
    }

    if (tokenTransfersToSave.length > 0) {
      await manager.save(TokenTransfer, tokenTransfersToSave);
    }

    if (contractsToSave.length > 0) {
      await manager.save(Contract, contractsToSave);
    }

    this.logger.debug(
      `Block #${blockNumber} indexed: ${transactionsToSave.length} transactions, ${receiptsToSave.length} receipts, ${tokenTransfersToSave.length} token transfers`,
    );
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
   * Receipt의 로그에서 ERC-20 Transfer 이벤트를 파싱하여 TokenTransfer 엔티티 배열 반환
   * (저장은 하지 않음, 중복 체크 포함)
   *
   * @param receiptData - 체인 Receipt 데이터
   * @param blockData - 이 Receipt가 포함된 블록 데이터
   * @param manager - TypeORM EntityManager
   * @param tokenExistsCache - 토큰 주소 존재 여부 캐시 (블록 단위)
   * @returns TokenTransfer 엔티티 배열
   */
  private async parseTokenTransfers(
    receiptData: ChainReceiptDto,
    blockData: ChainBlockDto,
    manager: any,
    tokenExistsCache: Map<string, boolean>,
  ): Promise<TokenTransfer[]> {
    const logs = receiptData.logs || [];
    const transfers: TokenTransfer[] = [];

    if (!logs.length) {
      return transfers;
    }

    const TRANSFER_TOPIC =
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    const blockNumber = hexToDecimalString(receiptData.blockNumber);
    const timestamp = hexToDecimalString(blockData.timestamp);
    const transactionHash = receiptData.transactionHash;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      if (!log || !Array.isArray(log.topics) || log.topics.length < 3) {
        continue;
      }

      const topic0 = String(log.topics[0]).toLowerCase();
      if (topic0 !== TRANSFER_TOPIC) {
        continue;
      }

      // indexed 파라미터에서 from/to 주소 디코딩
      const from = this.decodeAddressFromTopic(log.topics[1]);
      const to = this.decodeAddressFromTopic(log.topics[2]);

      // value는 data에 32바이트 정수로 인코딩
      const valueHex = log.data ?? '0x0';
      const value = hexToDecimalString(valueHex);

      const tokenAddress = String(log.address).toLowerCase();
      const blockHash = receiptData.blockHash;
      const logIndex: number =
        typeof log.logIndex === 'number' ? log.logIndex : i;

      // TokenTransfer 중복 체크 (transactionHash + logIndex 조합)
      const existingTransfer = await manager.findOne(TokenTransfer, {
        where: {
          transactionHash: transactionHash,
          logIndex: logIndex,
        },
      });

      if (existingTransfer) {
        this.logger.debug(
          `TokenTransfer for tx ${transactionHash} logIndex ${logIndex} already exists, skipping`,
        );
        // 토큰은 이미 존재할 가능성이 높지만, 캐시 업데이트는 계속 진행
        await this.ensureTokenExists(manager, tokenAddress, tokenExistsCache);
        continue;
      }

      const transfer = new TokenTransfer();
      transfer.tokenAddress = tokenAddress;
      transfer.from = from;
      transfer.to = to;
      transfer.value = value;
      transfer.blockNumber = blockNumber;
      transfer.blockHash = blockHash;
      transfer.transactionHash = transactionHash;
      transfer.logIndex = logIndex;
      transfer.timestamp = timestamp;

      transfers.push(transfer);

      // tokens 테이블에 토큰 주소만 우선 등록 (메타 정보는 별도 프로세스에서 채움)
      await this.ensureTokenExists(manager, tokenAddress, tokenExistsCache);
    }

    return transfers;
  }

  /**
   * 토픽에서 주소 디코딩 (마지막 20바이트)
   *
   * @param topic - 32바이트 Hex String (0x + 64자리)
   * @returns EVM 주소 (0x + 40자리, 소문자)
   */
  private decodeAddressFromTopic(topic: string): string {
    if (!topic) {
      return '0x0000000000000000000000000000000000000000';
    }

    const normalized = topic.toString().toLowerCase();
    const raw = normalized.startsWith('0x') ? normalized.slice(2) : normalized;
    const addressPart = raw.slice(-40);
    return `0x${addressPart}`;
  }

  /**
   * tokens 테이블에 토큰 주소가 존재하는지 확인하고, 없으면 address만 등록
   *
   * @param manager - TypeORM EntityManager
   * @param tokenAddress - 토큰 컨트랙트 주소 (소문자)
   * @param cache - 블록 단위 캐시
   */
  private async ensureTokenExists(
    manager: any,
    tokenAddress: string,
    cache: Map<string, boolean>,
  ): Promise<void> {
    if (cache.get(tokenAddress)) {
      return;
    }

    const existing = await manager.findOne(Token, {
      where: { address: tokenAddress },
    });

    if (existing) {
      cache.set(tokenAddress, true);
      return;
    }

    const token = new Token();
    token.address = tokenAddress;
    token.name = null;
    token.symbol = null;
    token.decimals = null;
    token.type = 'erc20';

    await manager.save(Token, token);
    cache.set(tokenAddress, true);
  }

  /**
   * 컨트랙트 정보 파싱 (컨트랙트 배포 감지 시)
   * (저장은 하지 않음, 중복 체크 포함)
   *
   * @param receiptData - Receipt 데이터
   * @param blockData - 블록 데이터
   * @param txData - 트랜잭션 데이터
   * @param manager - TypeORM EntityManager
   * @returns Contract 엔티티 또는 null (이미 존재하거나 주소가 없는 경우)
   */
  private async parseContract(
    receiptData: ChainReceiptDto,
    blockData: ChainBlockDto,
    txData: ChainTransactionDto,
    manager: any,
  ): Promise<Contract | null> {
    const contractAddress = receiptData.contractAddress;

    if (!contractAddress) {
      return null;
    }

    // 이미 저장된 컨트랙트인지 확인
    const existing = await manager.findOne(Contract, {
      where: { address: contractAddress },
    });

    if (existing) {
      this.logger.debug(`Contract ${contractAddress} already exists, skipping`);
      return null;
    }

    // 컨트랙트 바이트코드 조회 (체인에서)
    let bytecode: string | null = null;
    try {
      bytecode = await this.chainClient.getContractBytecode(contractAddress);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch bytecode for contract ${contractAddress}, continuing without it`,
      );
    }

    // Contract 엔티티 생성
    const contract = new Contract();
    contract.address = contractAddress;
    contract.deployer = receiptData.from;
    contract.transactionHash = receiptData.transactionHash;
    contract.blockNumber = hexToDecimalString(receiptData.blockNumber);
    contract.blockHash = receiptData.blockHash;
    contract.bytecode = bytecode;
    contract.abi = null; // 나중에 UI에서 업데이트
    contract.sourceCode = null;
    contract.name = null;
    contract.compilerVersion = null;
    contract.optimization = null;
    contract.timestamp = hexToDecimalString(blockData.timestamp);

    return contract;
  }

  // 계정 정보는 더 이상 DB에 저장하지 않음
  // API 조회 시 Chain RPC를 통해 실시간으로 가져옴
}
