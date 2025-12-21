import { ChainClientService } from '@app/chain-client';
import {
  decodeMultipleUint256,
  hexToBoolean,
  hexToDecimalString,
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
   */
  async depositCollateral(
    privateKey: string,
    amount: string,
  ): Promise<{ hash: string; status: string }> {
    const response = await this.client.post('/stablecoin/deposit', {
      privateKey,
      amount,
    });
    return response.data;
  }

  /**
   * 스테이블코인 발행
   *
   * POST /stablecoin/mint
   */
  async mintStablecoin(
    privateKey: string,
    stablecoinAmount: string,
  ): Promise<{ hash: string; status: string }> {
    const response = await this.client.post('/stablecoin/mint', {
      privateKey,
      stablecoinAmount,
    });
    return response.data;
  }

  /**
   * 스테이블코인 상환
   *
   * POST /stablecoin/redeem
   */
  async redeemStablecoin(
    privateKey: string,
    stablecoinAmount: string,
  ): Promise<{ hash: string; status: string }> {
    const response = await this.client.post('/stablecoin/redeem', {
      privateKey,
      stablecoinAmount,
    });
    return response.data;
  }

  /**
   * 담보 인출
   *
   * POST /stablecoin/withdraw
   */
  async withdrawCollateral(
    privateKey: string,
    amount: string,
  ): Promise<{ hash: string; status: string }> {
    const response = await this.client.post('/stablecoin/withdraw', {
      privateKey,
      amount,
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
    debtAmount: string;
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

    // 코어 수정: * 100을 제거하고 비율(배수)만 반환하므로 그대로 디코딩
    return {
      collateralAmount: decodeHex(data.collateralAmount),
      debtAmount: decodeHex(data.debtAmount),
      collateralRatio: decodeHex(data.collateralRatio),
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
}

