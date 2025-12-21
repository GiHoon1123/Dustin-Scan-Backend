import { ChainClientService } from '@app/chain-client';
import { dstnToWei, hexToBoolean, hexToDecimalString, weiToDstn } from '@app/common';
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
}
