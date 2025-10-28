import { Transaction } from '@app/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
  ) {}

  async getTransactions(page = 1, limit = 20): Promise<TransactionResponseDto[]> {
    // TODO: 페이징 처리
    return [];
  }

  async getTransactionByHash(hash: string): Promise<TransactionResponseDto> {
    // TODO: 해시로 트랜잭션 조회
    return null;
  }

  async getTransactionsByAddress(
    address: string,
    page = 1,
    limit = 20,
  ): Promise<TransactionResponseDto[]> {
    // TODO: 주소의 트랜잭션 조회 (from or to)
    return [];
  }

  private toDto(tx: Transaction): TransactionResponseDto {
    // TODO: Entity → DTO 변환
    return null;
  }
}
