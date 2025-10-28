import { weiToDstn } from '@app/common';
import {
  Transaction,
  TransactionReceipt,
  TransactionReceiptRepository,
  TransactionRepository,
} from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionResponseDto } from './dto/transaction-response.dto';

/**
 * 트랜잭션 조회 서비스
 *
 * Transaction + TransactionReceipt을 조인하여 완전한 정보 제공
 * - 기본 트랜잭션 정보 (hash, from, to, value 등)
 * - Receipt 정보 (status, gasUsed 등)
 * - 비즈니스 로직에 집중하고, 데이터 접근은 레포지토리에 위임
 */
@Injectable()
export class TransactionsService {
  constructor(
    private readonly txRepo: TransactionRepository,
    private readonly receiptRepo: TransactionReceiptRepository,
  ) {}

  /**
   * 트랜잭션 목록 조회 (최신순)
   *
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns 트랜잭션 목록 (Receipt 포함)
   */
  async getTransactions(page = 1, limit = 20): Promise<TransactionResponseDto[]> {
    const [transactions] = await this.txRepo.findPaginated(page, limit);

    // 트랜잭션 해시 배열 추출
    const txHashes = transactions.map((tx) => tx.hash);

    // 리시트 일괄 조회 (성능 최적화)
    const receipts = await this.receiptRepo.findByTransactionHashes(txHashes);
    const receiptMap = new Map(receipts.map((r) => [r.transactionHash, r]));

    // 트랜잭션 DTO 변환
    return transactions.map((tx) => {
      const receipt = receiptMap.get(tx.hash);
      return this.toDto(tx, receipt || null);
    });
  }

  /**
   * 트랜잭션 상세 조회 (해시로)
   *
   * @param hash - 트랜잭션 해시
   * @returns 트랜잭션 상세 (Receipt 포함)
   */
  async getTransactionByHash(hash: string): Promise<TransactionResponseDto> {
    const tx = await this.txRepo.findByHash(hash);

    if (!tx) {
      throw new NotFoundException(`Transaction ${hash} not found`);
    }

    const receipt = await this.receiptRepo.findByTransactionHash(hash);

    return this.toDto(tx, receipt);
  }

  /**
   * 특정 주소의 트랜잭션 조회
   *
   * from 또는 to가 해당 주소인 트랜잭션 조회
   *
   * @param address - 계정 주소
   * @param page - 페이지 번호
   * @param limit - 페이지당 개수
   * @returns 트랜잭션 목록 및 전체 개수 (Receipt 포함)
   */
  async getTransactionsByAddress(
    address: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: TransactionResponseDto[]; totalCount: number }> {
    const [transactions, totalCount] = await this.txRepo.findByAddressPaginated(
      address,
      page,
      limit,
    );

    // 트랜잭션 해시 배열 추출
    const txHashes = transactions.map((tx) => tx.hash);

    // 리시트 일괄 조회 (성능 최적화)
    const receipts = await this.receiptRepo.findByTransactionHashes(txHashes);
    const receiptMap = new Map(receipts.map((r) => [r.transactionHash, r]));

    // 트랜잭션 DTO 변환
    const transactionsWithReceipts = transactions.map((tx) => {
      const receipt = receiptMap.get(tx.hash);
      return this.toDto(tx, receipt || null);
    });

    return {
      transactions: transactionsWithReceipts,
      totalCount,
    };
  }

  /**
   * Entity → DTO 변환
   *
   * Transaction + TransactionReceipt → TransactionResponseDto
   *
   * @param tx - Transaction 엔티티
   * @param receipt - TransactionReceipt 엔티티 (nullable)
   * @returns TransactionResponseDto
   */
  private toDto(tx: Transaction, receipt: TransactionReceipt | null): TransactionResponseDto {
    return {
      // 기본 트랜잭션 정보
      hash: tx.hash,
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      value: weiToDstn(tx.value), // DSTN 단위
      valueWei: tx.value, // Wei 단위 (원본)
      nonce: tx.nonce,
      timestamp: tx.timestamp,
      createdAt: tx.createdAt.toISOString(),

      // Receipt 정보 (있는 경우)
      status: receipt?.status,
      gasUsed: receipt?.gasUsed,
      cumulativeGasUsed: receipt?.cumulativeGasUsed,
      contractAddress: receipt?.contractAddress,
    };
  }
}
