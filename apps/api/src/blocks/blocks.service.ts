import { weiToDstn } from '@app/common';
import {
  Block,
  BlockRepository,
  Transaction,
  TransactionReceipt,
  TransactionReceiptRepository,
  TransactionRepository,
} from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';
import { BlockDetailResponseDto } from './dto/block-detail-response.dto';
import { BlockResponseDto } from './dto/block-response.dto';

/**
 * 블록 조회 서비스
 *
 * 비즈니스 로직에 집중하고, 데이터 접근은 레포지토리에 위임
 */
@Injectable()
export class BlocksService {
  constructor(
    private readonly blockRepo: BlockRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly receiptRepo: TransactionReceiptRepository,
  ) {}

  /**
   * 블록 목록 조회 (최신순)
   *
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns 블록 목록 및 전체 개수
   */
  async getBlocks(
    page = 1,
    limit = 20,
  ): Promise<{ blocks: BlockResponseDto[]; totalCount: number }> {
    const [blocks, totalCount] = await this.blockRepo.findPaginated(page, limit);

    return {
      blocks: blocks.map((block) => this.toListDto(block)),
      totalCount,
    };
  }

  /**
   * 블록 상세 조회 (해시로)
   *
   * @param hash - 블록 해시
   * @returns 블록 상세 (트랜잭션 포함)
   */
  async getBlockByHash(hash: string): Promise<BlockDetailResponseDto> {
    const block = await this.blockRepo.findByHash(hash);

    if (!block) {
      throw new NotFoundException(`블록 해시 ${hash}를 찾을 수 없습니다`);
    }

    return this.toDetailDto(block);
  }

  /**
   * 블록 상세 조회 (번호로)
   *
   * @param number - 블록 번호
   * @returns 블록 상세 (트랜잭션 포함)
   */
  async getBlockByNumber(number: number): Promise<BlockDetailResponseDto> {
    const block = await this.blockRepo.findByNumber(number.toString());

    if (!block) {
      throw new NotFoundException(`블록 번호 #${number}를 찾을 수 없습니다`);
    }

    return this.toDetailDto(block);
  }

  /**
   * Entity → 목록용 DTO 변환 (트랜잭션 제외)
   */
  private toListDto(block: Block): BlockResponseDto {
    return {
      hash: block.hash,
      number: block.number,
      timestamp: block.timestamp,
      parentHash: block.parentHash,
      proposer: block.proposer,
      transactionCount: block.transactionCount,
      stateRoot: block.stateRoot,
      transactionsRoot: block.transactionsRoot,
      receiptsRoot: block.receiptsRoot,
      createdAt: block.createdAt.toISOString(),
    };
  }

  /**
   * Entity → 상세용 DTO 변환 (트랜잭션 포함)
   */
  private async toDetailDto(block: Block): Promise<BlockDetailResponseDto> {
    // 블록에 포함된 트랜잭션 조회
    const transactions = await this.transactionRepo.findByBlockHash(block.hash);

    // 트랜잭션 해시 배열 추출
    const txHashes = transactions.map((tx) => tx.hash);

    // 리시트 일괄 조회 (성능 최적화)
    const receipts = await this.receiptRepo.findByTransactionHashes(txHashes);
    const receiptMap = new Map(receipts.map((r) => [r.transactionHash, r]));

    // 트랜잭션 DTO 변환
    const transactionDtos = transactions.map((tx) => {
      const receipt = receiptMap.get(tx.hash);
      return this.txToDto(tx, receipt || null);
    });

    return {
      hash: block.hash,
      number: block.number,
      timestamp: block.timestamp,
      parentHash: block.parentHash,
      proposer: block.proposer,
      transactionCount: block.transactionCount,
      stateRoot: block.stateRoot,
      transactionsRoot: block.transactionsRoot,
      receiptsRoot: block.receiptsRoot,
      createdAt: block.createdAt.toISOString(),
      transactions: transactionDtos,
    };
  }

  /**
   * Transaction Entity → DTO 변환
   */
  private txToDto(tx: Transaction, receipt: TransactionReceipt | null): TransactionResponseDto {
    return {
      hash: tx.hash,
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      value: weiToDstn(tx.value),
      valueWei: tx.value,
      nonce: tx.nonce,
      timestamp: tx.timestamp,
      createdAt: tx.createdAt.toISOString(),
      status: receipt?.status,
      gasUsed: receipt?.gasUsed,
      cumulativeGasUsed: receipt?.cumulativeGasUsed,
      contractAddress: receipt?.contractAddress,
    };
  }
}
