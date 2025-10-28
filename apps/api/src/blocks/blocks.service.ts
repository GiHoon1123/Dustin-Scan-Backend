import { Block } from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockResponseDto } from './dto/block-response.dto';

/**
 * 블록 조회 서비스
 */
@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private blockRepo: Repository<Block>,
  ) {}

  /**
   * 블록 목록 조회 (최신순)
   * 
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns 블록 목록 및 전체 개수
   */
  async getBlocks(page = 1, limit = 20): Promise<{ blocks: BlockResponseDto[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const [blocks, totalCount] = await this.blockRepo.findAndCount({
      order: { number: 'DESC' },
      take: limit,
      skip,
    });

    return {
      blocks: blocks.map((block) => this.toDto(block)),
      totalCount,
    };
  }

  /**
   * 블록 상세 조회 (해시로)
   * 
   * @param hash - 블록 해시
   * @returns 블록 상세
   */
  async getBlockByHash(hash: string): Promise<BlockResponseDto> {
    const block = await this.blockRepo.findOne({ where: { hash } });

    if (!block) {
      throw new NotFoundException(`블록 해시 ${hash}를 찾을 수 없습니다`);
    }

    return this.toDto(block);
  }

  /**
   * 블록 상세 조회 (번호로)
   * 
   * @param number - 블록 번호
   * @returns 블록 상세
   */
  async getBlockByNumber(number: number): Promise<BlockResponseDto> {
    const block = await this.blockRepo.findOne({
      where: { number: number.toString() },
    });

    if (!block) {
      throw new NotFoundException(`블록 번호 #${number}를 찾을 수 없습니다`);
    }

    return this.toDto(block);
  }

  /**
   * Entity → DTO 변환
   */
  private toDto(block: Block): BlockResponseDto {
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
}
