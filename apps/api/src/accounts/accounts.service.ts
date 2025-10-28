import { Account } from '@app/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountResponseDto } from './dto/account-response.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
  ) {}

  async getAccount(address: string): Promise<AccountResponseDto> {
    // TODO: 주소로 계정 조회
    // TODO: Entity → DTO 변환
    return null;
  }

  async getAccounts(page = 1, limit = 20): Promise<AccountResponseDto[]> {
    // TODO: 페이징 처리
    return [];
  }

  private toDto(account: Account): AccountResponseDto {
    // TODO: Entity → DTO 변환
    return null;
  }
}
