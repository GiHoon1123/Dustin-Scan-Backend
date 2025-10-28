import { Block } from '@app/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockResponseDto } from './dto/block-response.dto';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private blockRepo: Repository<Block>,
  ) {}

  async getBlocks(page = 1, limit = 20): Promise<BlockResponseDto[]> {
    // TODO: 페이징 처리
    // TODO: Entity → DTO 변환
    return [];
  }

  async getBlockByHash(hash: string): Promise<BlockResponseDto> {
    // TODO: 해시로 블록 조회
    // TODO: Entity → DTO 변환
    return null;
  }

  async getBlockByNumber(number: number): Promise<BlockResponseDto> {
    // TODO: 번호로 블록 조회
    // TODO: Entity → DTO 변환
    return null;
  }

  private toDto(block: Block): BlockResponseDto {
    // TODO: Entity → DTO 변환 로직
    return null;
  }
}
