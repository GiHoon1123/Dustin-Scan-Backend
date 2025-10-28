import { ChainClientService } from '@app/chain-client';
import { hexToDecimal, weiToDstn } from '@app/common';
import { Transaction } from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountResponseDto } from './dto/account-response.dto';

/**
 * 계정 조회 서비스
 *
 * 실시간 RPC를 통해 계정 정보 조회 (DB 저장 X)
 * - Chain RPC: 잔액, nonce
 * - Transaction DB: 트랜잭션 개수 (송신 + 수신)
 */
@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private chainClient: ChainClientService,
  ) {}

  /**
   * 계정 상세 조회
   *
   * @param address - 계정 주소 (0x...)
   * @returns 계정 정보 (실시간 RPC 조회 + DB 트랜잭션 개수)
   */
  async getAccount(address: string): Promise<AccountResponseDto> {
    // Chain RPC에서 실시간 잔액 및 nonce 조회
    const chainAccount = await this.chainClient.getAccount(address.toLowerCase());

    if (!chainAccount) {
      throw new NotFoundException(`Account ${address} not found`);
    }

    // DB에서 트랜잭션 개수 조회 (from 또는 to가 해당 주소인 경우)
    const txCount = await this.transactionRepo.count({
      where: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }],
    });

    return this.toDto(chainAccount, txCount, address.toLowerCase());
  }


  /**
   * Chain 데이터 → DTO 변환
   */
  private toDto(chainAccount: any, txCount: number, address: string): AccountResponseDto {
    const balanceWei = hexToDecimal(chainAccount.balance).toString();

    return {
      address,
      balance: weiToDstn(balanceWei), // DSTN 단위 (사용자 친화적)
      balanceWei, // Wei 단위 (원본)
      nonce: hexToDecimal(chainAccount.nonce),
      txCount,
    };
  }
}
