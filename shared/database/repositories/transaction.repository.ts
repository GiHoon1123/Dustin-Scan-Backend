import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

/**
 * 트랜잭션 레포지토리
 *
 * 트랜잭션 데이터 접근 로직을 캡슐화
 * - 기본 CRUD
 * - 페이징 조회
 * - 주소별 조회 (from/to)
 * - 블록별 조회
 */
@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  /**
   * 트랜잭션 해시로 조회
   * @param hash - 트랜잭션 해시
   * @returns Transaction 엔티티 또는 null
   */
  async findByHash(hash: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { hash } });
  }

  /**
   * 블록 해시로 트랜잭션 목록 조회
   * @param blockHash - 블록 해시
   * @returns Transaction 엔티티 배열 (nonce 순)
   */
  async findByBlockHash(blockHash: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { blockHash },
      order: { nonce: 'ASC' },
    });
  }

  /**
   * 블록 번호로 트랜잭션 목록 조회
   * @param blockNumber - 블록 번호 (bigint string)
   * @returns Transaction 엔티티 배열 (nonce 순)
   */
  async findByBlockNumber(blockNumber: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { blockNumber },
      order: { nonce: 'ASC' },
    });
  }

  /**
   * 트랜잭션 목록 페이징 조회 (최신순)
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns [트랜잭션 배열, 전체 개수]
   */
  async findPaginated(page: number, limit: number): Promise<[Transaction[], number]> {
    const skip = (page - 1) * limit;

    return this.repository.findAndCount({
      order: { blockNumber: 'DESC', hash: 'DESC' },
      skip,
      take: limit,
    });
  }

  /**
   * 특정 주소와 관련된 트랜잭션 페이징 조회
   * (from 또는 to가 해당 주소인 경우)
   *
   * @param address - 계정 주소
   * @param page - 페이지 번호
   * @param limit - 페이지당 개수
   * @returns [트랜잭션 배열, 전체 개수]
   */
  async findByAddressPaginated(
    address: string,
    page: number,
    limit: number,
  ): Promise<[Transaction[], number]> {
    const skip = (page - 1) * limit;
    const addressLower = address.toLowerCase();

    // 전체 개수 조회
    const totalCount = await this.repository
      .createQueryBuilder('tx')
      .where('tx.from = :address OR tx.to = :address', { address: addressLower })
      .getCount();

    // 페이징된 트랜잭션 조회
    const transactions = await this.repository
      .createQueryBuilder('tx')
      .where('tx.from = :address OR tx.to = :address', { address: addressLower })
      .orderBy('tx.blockNumber', 'DESC')
      .addOrderBy('tx.hash', 'DESC')
      .take(limit)
      .skip(skip)
      .getMany();

    return [transactions, totalCount];
  }

  /**
   * 특정 주소와 관련된 트랜잭션 개수 조회
   * @param address - 계정 주소
   * @returns 트랜잭션 개수
   */
  async countByAddress(address: string): Promise<number> {
    return this.repository.count({
      where: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }],
    });
  }

  /**
   * 트랜잭션 저장
   * @param transaction - Transaction 엔티티
   * @returns 저장된 Transaction 엔티티
   */
  async save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }

  /**
   * 여러 트랜잭션 일괄 저장
   * @param transactions - Transaction 엔티티 배열
   * @returns 저장된 Transaction 엔티티 배열
   */
  async saveMany(transactions: Transaction[]): Promise<Transaction[]> {
    return this.repository.save(transactions);
  }

  /**
   * 전체 트랜잭션 개수 조회
   * @returns 전체 트랜잭션 개수
   */
  async count(): Promise<number> {
    return this.repository.count();
  }
}
