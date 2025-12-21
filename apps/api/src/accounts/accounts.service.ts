import { ChainClientService } from '@app/chain-client';
import { hexToDecimal, weiToDstn } from '@app/common';
import { Token, TokenRepository, TokenTransfer, TokenTransferRepository, TransactionRepository } from '@app/database';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AccountResponseDto } from './dto/account-response.dto';
import { TokenBalanceDto } from './dto/token-balance.dto';
import { TokenTransferItemDto } from './dto/token-transfer-item.dto';

/**
 * 계정 조회 서비스
 *
 * 실시간 RPC를 통해 계정 정보 조회 (DB 저장 X)
 * - Chain RPC: 잔액, nonce
 * - Transaction DB: 트랜잭션 개수 (송신 + 수신)
 * - 비즈니스 로직에 집중하고, 데이터 접근은 레포지토리에 위임
 */
@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  private readonly chainHttpClient: AxiosInstance;

  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly tokenTransferRepo: TokenTransferRepository,
    private readonly tokenRepo: TokenRepository,
    private readonly chainClient: ChainClientService,
  ) {
    const chainUrl = process.env.CHAIN_URL;
    if (!chainUrl) {
      throw new Error('CHAIN_URL environment variable is required');
    }

    this.chainHttpClient = axios.create({
      baseURL: chainUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

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
    const txCount = await this.transactionRepo.countByAddress(address.toLowerCase());

    return this.toDto(chainAccount, txCount, address.toLowerCase());
  }

  /**
   * 특정 주소가 보유한 토큰 자산 목록 조회
   */
  async getTokenBalances(
    address: string,
    page: number,
    limit: number,
  ): Promise<{ items: TokenBalanceDto[] }> {
    const normalized = address.toLowerCase();
    const rows = await this.tokenTransferRepo.getTokenBalancesByAddress(
      normalized,
      page,
      limit,
    );

    const items: TokenBalanceDto[] = [];

    for (const row of rows) {
      const tokenAddress = row.tokenAddress.toLowerCase();
      const token = await this.tokenRepo.findByAddress(tokenAddress);

      const dto: TokenBalanceDto = {
        tokenAddress,
        name: token?.name ?? null,
        symbol: token?.symbol ?? null,
        decimals: token?.decimals ?? null,
        balance: row.balance,
      };

      items.push(dto);
    }

    return { items };
  }

  /**
   * 특정 주소 기준 토큰 전송 내역 조회
   */
  async getTokenTransfers(
    address: string,
    tokenAddress: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: TokenTransferItemDto[]; totalCount: number }> {
    const normalizedAddress = address.toLowerCase();

    let transfers: TokenTransfer[];
    let totalCount: number;

    if (tokenAddress) {
      [transfers, totalCount] = await this.tokenTransferRepo.findByTokenAndAddressPaginated(
        tokenAddress,
        normalizedAddress,
        page,
        limit,
      );
    } else {
      [transfers, totalCount] = await this.tokenTransferRepo.findByAddressPaginated(
        normalizedAddress,
        page,
        limit,
      );
    }

    const items: TokenTransferItemDto[] = transfers.map((t) => {
      let direction: 'in' | 'out' | 'self';
      if (t.from === normalizedAddress && t.to === normalizedAddress) {
        direction = 'self';
      } else if (t.to === normalizedAddress) {
        direction = 'in';
      } else {
        direction = 'out';
      }

      return {
        tokenAddress: t.tokenAddress,
        from: t.from,
        to: t.to,
        value: t.value,
        blockNumber: t.blockNumber,
        transactionHash: t.transactionHash,
        logIndex: t.logIndex,
        timestamp: t.timestamp,
        direction,
      };
    });

    return { items, totalCount };
  }

  /**
   * 새 지갑 생성
   *
   * POST /account/create-wallet
   */
  async createWallet(): Promise<{
    privateKey: string;
    publicKey: string;
    address: string;
    balance: string;
    nonce: number;
  }> {
    const response = await this.chainHttpClient.post('/account/create-wallet');
    return response.data;
  }

  /**
   * Chain 데이터 → DTO 변환
   */
  private toDto(chainAccount: any, txCount: number, address: string): AccountResponseDto {
    // hex string을 직접 decimal string으로 변환 (큰 숫자 정밀도 유지)
    const balanceWei = BigInt(chainAccount.balance).toString();

    return {
      address,
      balance: weiToDstn(balanceWei), // DSTN 단위 (사용자 친화적)
      balanceWei, // Wei 단위 (원본)
      nonce: hexToDecimal(chainAccount.nonce),
      txCount,
    };
  }
}
