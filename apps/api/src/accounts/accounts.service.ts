import { ChainClientService } from '@app/chain-client';
import { dstnToWei, hexToDecimal, tokenToDecimal, weiToDstn } from '@app/common';
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

      const tokenDecimals = token?.decimals ?? 18;
      const balanceWei = row.balance;

      const dto: TokenBalanceDto = {
        tokenAddress,
        name: token?.name ?? null,
        symbol: token?.symbol ?? null,
        decimals: token?.decimals ?? null,
        balance: tokenToDecimal(balanceWei, tokenDecimals), // 토큰 단위
        balanceSmallestUnit: balanceWei, // 원본 (토큰 최소 단위)
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

    // 토큰 정보 일괄 조회 (성능 최적화)
    const tokenAddresses = [...new Set(transfers.map((t) => t.tokenAddress))];
    const tokens = await Promise.all(
      tokenAddresses.map((addr) => this.tokenRepo.findByAddress(addr)),
    );
    const tokenMap = new Map(
      tokens.map((token, idx) => [tokenAddresses[idx]?.toLowerCase(), token]),
    );

    const items: TokenTransferItemDto[] = transfers.map((t) => {
      let direction: 'in' | 'out' | 'self';
      if (t.from === normalizedAddress && t.to === normalizedAddress) {
        direction = 'self';
      } else if (t.to === normalizedAddress) {
        direction = 'in';
      } else {
        direction = 'out';
      }

      const token = tokenMap.get(t.tokenAddress.toLowerCase());
      const tokenDecimals = token?.decimals ?? 18;
      const valueWei = t.value;

      return {
        tokenAddress: t.tokenAddress,
        from: t.from,
        to: t.to,
        value: tokenToDecimal(valueWei, tokenDecimals), // 토큰 단위
        valueSmallestUnit: valueWei, // 원본 (토큰 최소 단위)
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
   * 트랜잭션이 블록에 포함될 때까지 대기
   *
   * @param txHash - 트랜잭션 해시
   * @param maxRetries - 최대 재시도 횟수 (기본값: 20)
   * @param delayMs - 재시도 간격 (기본값: 3000ms)
   * @returns 트랜잭션 결과 (confirmed/failed/pending)
   */
  private async waitForTransaction(
    txHash: string,
    maxRetries: number = 20,
    delayMs: number = 3000,
  ): Promise<{
    status: 'confirmed' | 'failed' | 'pending';
    blockNumber?: string;
    blockHash?: string;
  }> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const receipt = await this.chainClient.getReceipt(txHash);
        if (receipt && receipt.blockNumber) {
          // status 확인 (hex string 또는 number)
          const status =
            typeof receipt.status === 'string'
              ? parseInt(receipt.status, 16)
              : receipt.status;

          // blockNumber는 hex string이므로 decimal로 변환
          const blockNumberDecimal =
            typeof receipt.blockNumber === 'string'
              ? parseInt(receipt.blockNumber, 16)
              : receipt.blockNumber;

          if (status === 0) {
            this.logger.warn(
              `Transaction ${txHash} failed (status: 0x0) in block ${blockNumberDecimal}`,
            );
            return {
              status: 'failed',
              blockNumber: blockNumberDecimal.toString(),
              blockHash: receipt.blockHash,
            };
          }

          this.logger.log(
            `Transaction ${txHash} succeeded (status: 0x1) in block ${blockNumberDecimal}`,
          );
          return {
            status: 'confirmed',
            blockNumber: blockNumberDecimal.toString(),
            blockHash: receipt.blockHash,
          };
        }
      } catch (error) {
        // Receipt가 아직 생성되지 않음 (정상)
        this.logger.debug(`Receipt not found for ${txHash}, retrying... (${i + 1}/${maxRetries})`);
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    this.logger.warn(
      `Transaction ${txHash} not included in block after ${maxRetries} retries`,
    );
    return {
      status: 'pending',
    };
  }

  /**
   * 네이티브 토큰(DSTN) 전송
   *
   * POST /transaction/send-native
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   * 트랜잭션이 블록에 반영될 때까지 대기
   */
  async transferNative(
    privateKey: string,
    to: string,
    amount: string,
  ): Promise<{
    hash: string;
    status: 'confirmed' | 'failed' | 'pending';
    blockNumber?: string;
    blockHash?: string;
  }> {
    // 10진수 DSTN → Wei (10진수 문자열) → 16진수 문자열
    const amountWei = dstnToWei(amount);
    const amountHex = '0x' + BigInt(amountWei).toString(16);

    // 코어에 전송 요청
    const response = await this.chainHttpClient.post('/transaction/send-native', {
      privateKey,
      to,
      amount: amountHex,
    });

    const txHash = response.data.hash;

    // 트랜잭션이 블록에 반영될 때까지 대기
    const result = await this.waitForTransaction(txHash);

    return {
      hash: txHash,
      ...result,
    };
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
