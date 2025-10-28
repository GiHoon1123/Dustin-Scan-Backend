import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../entities/block.entity';

/**
 * 블록 레포지토리
 *
 * 블록 데이터 접근 로직을 캡슐화
 * - 기본 CRUD
 * - 페이징 조회
 * - 검색 조건별 조회
 */
@Injectable()
export class BlockRepository {
  constructor(
    @InjectRepository(Block)
    private readonly repository: Repository<Block>,
  ) {}

  /**
   * 블록 해시로 조회
   * @param hash - 블록 해시
   * @returns Block 엔티티 또는 null
   */
  async findByHash(hash: string): Promise<Block | null> {
    return this.repository.findOne({ where: { hash } });
  }

  /**
   * 블록 번호로 조회
   * @param number - 블록 번호 (bigint string)
   * @returns Block 엔티티 또는 null
   */
  async findByNumber(number: string): Promise<Block | null> {
    return this.repository.findOne({ where: { number } });
  }

  /**
   * 최신 블록 N개 조회
   * @param limit - 조회할 개수
   * @returns Block 엔티티 배열
   */
  async findLatest(limit: number): Promise<Block[]> {
    return this.repository.find({
      order: { number: 'DESC' },
      take: limit,
    });
  }

  /**
   * 블록 목록 페이징 조회 (최신순)
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns [블록 배열, 전체 개수]
   */
  async findPaginated(page: number, limit: number): Promise<[Block[], number]> {
    const skip = (page - 1) * limit;

    return this.repository.findAndCount({
      order: { number: 'DESC' },
      skip,
      take: limit,
    });
  }

  /**
   * 마지막으로 저장된 블록 조회
   * @returns 가장 높은 번호의 Block 엔티티 또는 null
   */
  async findLastSaved(): Promise<Block | null> {
    return this.repository.findOne({
      order: { number: 'DESC' },
    });
  }

  /**
   * 블록 저장
   * @param block - Block 엔티티
   * @returns 저장된 Block 엔티티
   */
  async save(block: Block): Promise<Block> {
    return this.repository.save(block);
  }

  /**
   * 특정 범위의 블록 개수 조회
   * @returns 전체 블록 개수
   */
  async count(): Promise<number> {
    return this.repository.count();
  }
}
