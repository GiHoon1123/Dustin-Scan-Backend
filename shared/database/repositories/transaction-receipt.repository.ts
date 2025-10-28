import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TransactionReceipt } from '../entities/transaction-receipt.entity';

/**
 * 트랜잭션 리시트 레포지토리
 *
 * 트랜잭션 실행 결과(Receipt) 데이터 접근 로직을 캡슐화
 * - 기본 CRUD
 * - 트랜잭션 해시로 조회
 * - 블록별 조회
 * - 일괄 조회
 */
@Injectable()
export class TransactionReceiptRepository {
  constructor(
    @InjectRepository(TransactionReceipt)
    private readonly repository: Repository<TransactionReceipt>,
  ) {}

  /**
   * 트랜잭션 해시로 리시트 조회
   * @param transactionHash - 트랜잭션 해시
   * @returns TransactionReceipt 엔티티 또는 null
   */
  async findByTransactionHash(transactionHash: string): Promise<TransactionReceipt | null> {
    return this.repository.findOne({ where: { transactionHash } });
  }

  /**
   * 여러 트랜잭션 해시로 리시트 일괄 조회
   * @param transactionHashes - 트랜잭션 해시 배열
   * @returns TransactionReceipt 엔티티 배열
   */
  async findByTransactionHashes(transactionHashes: string[]): Promise<TransactionReceipt[]> {
    if (transactionHashes.length === 0) {
      return [];
    }

    return this.repository.find({
      where: { transactionHash: In(transactionHashes) },
    });
  }

  /**
   * 블록 해시로 리시트 목록 조회
   * @param blockHash - 블록 해시
   * @returns TransactionReceipt 엔티티 배열 (트랜잭션 인덱스 순)
   */
  async findByBlockHash(blockHash: string): Promise<TransactionReceipt[]> {
    return this.repository.find({
      where: { blockHash },
      order: { transactionIndex: 'ASC' },
    });
  }

  /**
   * 블록 번호로 리시트 목록 조회
   * @param blockNumber - 블록 번호 (bigint string)
   * @returns TransactionReceipt 엔티티 배열 (트랜잭션 인덱스 순)
   */
  async findByBlockNumber(blockNumber: string): Promise<TransactionReceipt[]> {
    return this.repository.find({
      where: { blockNumber },
      order: { transactionIndex: 'ASC' },
    });
  }

  /**
   * 리시트 저장
   * @param receipt - TransactionReceipt 엔티티
   * @returns 저장된 TransactionReceipt 엔티티
   */
  async save(receipt: TransactionReceipt): Promise<TransactionReceipt> {
    return this.repository.save(receipt);
  }

  /**
   * 여러 리시트 일괄 저장
   * @param receipts - TransactionReceipt 엔티티 배열
   * @returns 저장된 TransactionReceipt 엔티티 배열
   */
  async saveMany(receipts: TransactionReceipt[]): Promise<TransactionReceipt[]> {
    return this.repository.save(receipts);
  }

  /**
   * 전체 리시트 개수 조회
   * @returns 전체 리시트 개수
   */
  async count(): Promise<number> {
    return this.repository.count();
  }
}
