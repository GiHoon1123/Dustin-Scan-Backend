import { ChainClientService } from '@app/chain-client';
import {
  dstnToWei,
  hexToBoolean,
  hexToDecimalString,
  tokenToDecimal,
  weiToDstn,
} from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Stablecoin Proxy Service
 *
 * 코어 체인의 스테이블 코인 API를 프록시하고 응답을 디코딩
 */
@Injectable()
export class StablecoinService {
  private readonly logger = new Logger(StablecoinService.name);
  private readonly client: AxiosInstance;
  private readonly chainUrl: string;

  constructor(private readonly chainClient: ChainClientService) {
    this.chainUrl = process.env.CHAIN_URL;

    if (!this.chainUrl) {
      throw new Error('CHAIN_URL environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.chainUrl,
      timeout: 30000, // 30초 타임아웃
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Stablecoin Proxy Service initialized: ${this.chainUrl}`);
  }

  /**
   * 담보 예치
   *
   * POST /stablecoin/deposit
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   */
  async depositCollateral(
    privateKey: string,
    amount: string,
  ): Promise<{ hash: string; status: string }> {
    // 10진수 DSTN → Wei (10진수 문자열) → 16진수 문자열
    const amountWei = dstnToWei(amount);
    const amountHex = '0x' + BigInt(amountWei).toString(16);

    const response = await this.client.post('/stablecoin/deposit', {
      privateKey,
      amount: amountHex,
    });
    return response.data;
  }

  /**
   * 스테이블코인 발행
   *
   * POST /stablecoin/mint
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   */
  async mintStablecoin(
    privateKey: string,
    stablecoinAmount: string,
  ): Promise<{ hash: string; status: string }> {
    // 10진수 DSTN → Wei (10진수 문자열) → 16진수 문자열
    const amountWei = dstnToWei(stablecoinAmount);
    const amountHex = '0x' + BigInt(amountWei).toString(16);

    const response = await this.client.post('/stablecoin/mint', {
      privateKey,
      stablecoinAmount: amountHex,
    });
    return response.data;
  }

  /**
   * 스테이블코인 상환
   *
   * POST /stablecoin/redeem
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   */
  async redeemStablecoin(
    privateKey: string,
    stablecoinAmount: string,
  ): Promise<{ hash: string; status: string }> {
    // 10진수 DSTN → Wei (10진수 문자열) → 16진수 문자열
    const amountWei = dstnToWei(stablecoinAmount);
    const amountHex = '0x' + BigInt(amountWei).toString(16);

    const response = await this.client.post('/stablecoin/redeem', {
      privateKey,
      stablecoinAmount: amountHex,
    });
    return response.data;
  }

  /**
   * 담보 인출
   *
   * POST /stablecoin/withdraw
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   */
  async withdrawCollateral(
    privateKey: string,
    amount: string,
  ): Promise<{ hash: string; status: string }> {
    // 10진수 DSTN → Wei (10진수 문자열) → 16진수 문자열
    const amountWei = dstnToWei(amount);
    const amountHex = '0x' + BigInt(amountWei).toString(16);

    const response = await this.client.post('/stablecoin/withdraw', {
      privateKey,
      amount: amountHex,
    });
    return response.data;
  }

  /**
   * 청산 실행
   *
   * POST /stablecoin/liquidate
   */
  async liquidate(
    privateKey: string,
    userAddress: string,
  ): Promise<{ hash: string; status: string }> {
    const response = await this.client.post('/stablecoin/liquidate', {
      privateKey,
      userAddress,
    });
    return response.data;
  }

  /**
   * 포지션 조회 (디코딩 포함)
   *
   * GET /stablecoin/position/:userAddress
   */
  async getPosition(userAddress: string): Promise<{
    collateralAmount: string;
    collateralAmountWei: string;
    debtAmount: string;
    debtAmountWei: string;
    collateralRatio: string;
  }> {
    const response = await this.client.get(`/stablecoin/position/${userAddress}`);
    const data = response.data;

    // 코어에서 이미 hex string으로 분리해서 반환하므로 각각 디코딩
    // 빈 hex string 처리
    const decodeHex = (hex: string): string => {
      if (!hex || hex === '0x' || hex === '0x0') {
        return '0';
      }
      return hexToDecimalString(hex);
    };

    // Wei 단위로 디코딩
    const collateralAmountWei = decodeHex(data.collateralAmount);
    const debtAmountWei = decodeHex(data.debtAmount);
    const collateralRatio = decodeHex(data.collateralRatio);

    // DSTN 단위로 변환 (Accounts, Transactions API와 동일한 방식)
    return {
      collateralAmount: weiToDstn(collateralAmountWei),
      collateralAmountWei,
      debtAmount: weiToDstn(debtAmountWei),
      debtAmountWei,
      collateralRatio,
    };
  }

  /**
   * 건강도 확인 (디코딩 포함)
   *
   * GET /stablecoin/health/:userAddress
   */
  async getHealth(userAddress: string): Promise<{ isHealthy: boolean }> {
    const response = await this.client.get(`/stablecoin/health/${userAddress}`);
    const data = response.data;

    // hex string을 boolean으로 디코딩
    return {
      isHealthy: hexToBoolean(data.result),
    };
  }

  /**
   * 스테이블코인 잔액 조회 (디코딩 포함)
   *
   * GET /stablecoin/balance/:userAddress
   * 코어에서 받은 balance (hex string, Wei 단위)를 디코딩하여
   * 토큰 단위와 smallest unit 둘 다 제공
   */
  async getStablecoinBalance(userAddress: string): Promise<{
    balance: string; // 토큰 단위 (USDST, 사용자 친화적)
    balanceWei: string; // Wei 단위 (원본, 10진수 문자열)
  }> {
    const response = await this.client.get(`/stablecoin/balance/${userAddress}`);
    const data = response.data;

    // 빈 hex string 처리
    const decodeHex = (hex: string): string => {
      if (!hex || hex === '0x' || hex === '0x0') {
        return '0';
      }
      return hexToDecimalString(hex);
    };

    // smallest unit로 디코딩 (스테이블코인은 18 decimals)
    const balanceSmallestUnit = decodeHex(data.balance);
    const tokenDecimals = 18; // USDST는 18 decimals
    const balance = tokenToDecimal(balanceSmallestUnit, tokenDecimals);

    return {
      balance, // 토큰 단위
      balanceWei: balanceSmallestUnit, // Wei 단위 (원본)
    };
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
   * 스테이블코인 전송
   *
   * POST /stablecoin/transfer
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   * 트랜잭션이 블록에 반영될 때까지 대기
   */
  async transferStablecoin(
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
    const response = await this.client.post('/stablecoin/transfer', {
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
}
