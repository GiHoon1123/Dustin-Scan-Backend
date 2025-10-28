import { weiToDstn } from '@app/common';
import { Transaction, TransactionReceipt } from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TransactionResponseDto } from './dto/transaction-response.dto';

/**
 * 트랜잭션 조회 서비스
 *
 * Transaction + TransactionReceipt을 조인하여 완전한 정보 제공
 * - 기본 트랜잭션 정보 (hash, from, to, value 등)
 * - Receipt 정보 (status, gasUsed 등)
 */
@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    @InjectRepository(TransactionReceipt)
    private receiptRepo: Repository<TransactionReceipt>,
  ) {}

  /**
   * 트랜잭션 목록 조회 (최신순)
   *
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns 트랜잭션 목록 (Receipt 포함)
   */
  async getTransactions(page = 1, limit = 20): Promise<TransactionResponseDto[]> {
    const skip = (page - 1) * limit;

    const transactions = await this.txRepo.find({
      order: { blockNumber: 'DESC', hash: 'DESC' },
      take: limit,
      skip,
    });

    // 각 트랜잭션에 대한 Receipt 조회
    return Promise.all(
      transactions.map(async (tx) => {
        const receipt = await this.receiptRepo.findOne({
          where: { transactionHash: tx.hash },
        });
        return this.toDto(tx, receipt);
      }),
    );
  }

  /**
   * 트랜잭션 상세 조회 (해시로)
   *
   * @param hash - 트랜잭션 해시
   * @returns 트랜잭션 상세 (Receipt 포함)
   */
  async getTransactionByHash(hash: string): Promise<TransactionResponseDto> {
    const tx = await this.txRepo.findOne({ where: { hash } });

    if (!tx) {
      throw new NotFoundException(`Transaction ${hash} not found`);
    }

    const receipt = await this.receiptRepo.findOne({
      where: { transactionHash: hash },
    });

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
    const skip = (page - 1) * limit;
    const addressLower = address.toLowerCase();

    // 전체 개수 조회
    const totalCount = await this.txRepo
      .createQueryBuilder('tx')
      .where('tx.from = :address OR tx.to = :address', { address: addressLower })
      .getCount();

    // 페이징된 트랜잭션 조회
    const transactions = await this.txRepo
      .createQueryBuilder('tx')
      .where('tx.from = :address OR tx.to = :address', { address: addressLower })
      .orderBy('tx.blockNumber', 'DESC')
      .addOrderBy('tx.hash', 'DESC')
      .take(limit)
      .skip(skip)
      .getMany();

    // 각 트랜잭션에 대한 Receipt 조회
    const transactionsWithReceipts = await Promise.all(
      transactions.map(async (tx) => {
        const receipt = await this.receiptRepo.findOne({
          where: { transactionHash: tx.hash },
        });
        return this.toDto(tx, receipt);
      }),
    );

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
