import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';

/**
 * Token Repository
 *
 * 토큰 메타 정보에 대한 데이터 접근 캡슐화
 */
@Injectable()
export class TokenRepository {
  constructor(
    @InjectRepository(Token)
    private readonly repository: Repository<Token>,
  ) {}

  /**
   * 토큰 주소로 조회
   */
  async findByAddress(address: string): Promise<Token | null> {
    return this.repository.findOne({ where: { address } });
  }

  /**
   * 토큰 저장/업데이트
   */
  async save(token: Token): Promise<Token> {
    return this.repository.save(token);
  }

  /**
   * 여러 토큰 일괄 저장
   */
  async saveMany(tokens: Token[]): Promise<Token[]> {
    return this.repository.save(tokens);
  }

  /**
   * 전체 토큰 개수 조회
   */
  async count(): Promise<number> {
    return this.repository.count();
  }
}


