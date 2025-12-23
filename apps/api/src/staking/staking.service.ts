import { ChainClientService } from '@app/chain-client';
import {
  dstnToWei,
  hexToDecimalString,
  weiToDstn,
} from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Staking Proxy Service
 *
 * 코어 체인의 스테이킹 API를 프록시하고 응답을 디코딩
 */
@Injectable()
export class StakingService {
  private readonly logger = new Logger(StakingService.name);
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

    this.logger.log(`Staking Proxy Service initialized: ${this.chainUrl}`);
  }

  /**
   * 스테이킹 예치
   *
   * POST /staking/deposit
   * 프론트에서 10진수 DSTN 문자열을 받아서 16진수 Wei로 변환
   * 트랜잭션이 블록에 반영될 때까지 대기
   */
  async deposit(
    privateKey: string,
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

    const response = await this.client.post('/staking/deposit', {
      privateKey,
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
   * 출금 주소 설정
   *
   * POST /staking/set-withdrawal-address
   * 트랜잭션이 블록에 반영될 때까지 대기
   */
  async setWithdrawalAddress(
    privateKey: string,
    withdrawalAddress: string,
  ): Promise<{
    hash: string;
    status: 'confirmed' | 'failed' | 'pending';
    blockNumber?: string;
    blockHash?: string;
  }> {
    const response = await this.client.post('/staking/set-withdrawal-address', {
      privateKey,
      withdrawalAddress,
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
   * 출금 요청
   *
   * POST /staking/request-withdrawal
   * 트랜잭션이 블록에 반영될 때까지 대기
   */
  async requestWithdrawal(
    privateKey: string,
  ): Promise<{
    hash: string;
    status: 'confirmed' | 'failed' | 'pending';
    blockNumber?: string;
    blockHash?: string;
  }> {
    const response = await this.client.post('/staking/request-withdrawal', {
      privateKey,
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
   * Validator 정보 조회
   *
   * GET /staking/validator/:address
   * 코어에서 받은 hex 값을 디코딩하여 사용자 친화적 값과 원본 값 모두 제공
   */
  async getValidator(validatorAddress: string): Promise<{
    validatorAddress: string;
    stakedAmount: string;
    stakedAmountWei: string;
    status: string;
    withdrawalAddress: string;
    activatedAt: string;
    exitRequestedAt: string;
    totalRewards: string;
    totalRewardsWei: string;
    slashedAmount: string;
    slashedAmountWei: string;
  }> {
    const response = await this.client.get(`/staking/validator/${validatorAddress}`);
    const data = response.data;

    // 빈 hex string 처리
    const decodeHex = (hex: string): string => {
      if (!hex || hex === '0x' || hex === '0x0') {
        return '0';
      }
      return hexToDecimalString(hex);
    };

    // Wei 단위로 디코딩
    const stakedAmountWei = decodeHex(data.stakedAmount);
    const totalRewardsWei = decodeHex(data.totalRewards);
    const slashedAmountWei = decodeHex(data.slashedAmount);
    const activatedAt = decodeHex(data.activatedAt);
    const exitRequestedAt = decodeHex(data.exitRequestedAt);

    // DSTN 단위로 변환
    return {
      validatorAddress: data.validatorAddress,
      stakedAmount: weiToDstn(stakedAmountWei),
      stakedAmountWei,
      status: data.status,
      withdrawalAddress: data.withdrawalAddress,
      activatedAt,
      exitRequestedAt,
      totalRewards: weiToDstn(totalRewardsWei),
      totalRewardsWei,
      slashedAmount: weiToDstn(slashedAmountWei),
      slashedAmountWei,
    };
  }

  /**
   * 활성 Validator 목록 조회
   *
   * GET /staking/validators
   * 각 Validator의 정보를 디코딩하여 반환
   */
  async getValidators(): Promise<{
    validators: Array<{
      validatorAddress: string;
      stakedAmount: string;
      stakedAmountWei: string;
      status: string;
      withdrawalAddress: string;
      activatedAt: string;
      exitRequestedAt: string;
      totalRewards: string;
      totalRewardsWei: string;
      slashedAmount: string;
      slashedAmountWei: string;
    }>;
    total: number;
  }> {
    const response = await this.client.get('/staking/validators');
    const data = response.data;

    // 빈 hex string 처리
    const decodeHex = (hex: string): string => {
      if (!hex || hex === '0x' || hex === '0x0') {
        return '0';
      }
      return hexToDecimalString(hex);
    };

    // 각 Validator 정보 디코딩 (코어에서 받은 데이터를 직접 디코딩)
    const validators = data.validators.map((validator: any) => {
      const stakedAmountWei = decodeHex(validator.stakedAmount);
      const totalRewardsWei = decodeHex(validator.totalRewards);
      const slashedAmountWei = decodeHex(validator.slashedAmount);
      const activatedAt = decodeHex(validator.activatedAt);
      const exitRequestedAt = decodeHex(validator.exitRequestedAt);

      return {
        validatorAddress: validator.validatorAddress,
        stakedAmount: weiToDstn(stakedAmountWei),
        stakedAmountWei,
        status: validator.status,
        withdrawalAddress: validator.withdrawalAddress,
        activatedAt,
        exitRequestedAt,
        totalRewards: weiToDstn(totalRewardsWei),
        totalRewardsWei,
        slashedAmount: weiToDstn(slashedAmountWei),
        slashedAmountWei,
      };
    });

    return {
      validators,
      total: validators.length,
    };
  }

  /**
   * 스테이킹 통계 조회
   *
   * GET /staking/stats
   * 코어에서 받은 hex 값을 디코딩하여 사용자 친화적 값과 원본 값 모두 제공
   */
  async getStats(): Promise<{
    totalStaked: string;
    totalStakedWei: string;
    totalValidators: number;
    activeValidators: number;
    totalRewards: string;
    totalRewardsWei: string;
    totalSlashed: string;
    totalSlashedWei: string;
    minStake: string;
    minStakeWei: string;
    maxValidators: number;
    withdrawalDelay: string;
  }> {
    const response = await this.client.get('/staking/stats');
    const data = response.data;

    // 빈 hex string 처리
    const decodeHex = (hex: string): string => {
      if (!hex || hex === '0x' || hex === '0x0') {
        return '0';
      }
      return hexToDecimalString(hex);
    };

    // Wei 단위로 디코딩
    const totalStakedWei = decodeHex(data.totalStaked);
    const totalRewardsWei = decodeHex(data.totalRewards);
    const totalSlashedWei = decodeHex(data.totalSlashed);
    const minStakeWei = decodeHex(data.minStake);
    const withdrawalDelay = decodeHex(data.withdrawalDelay);

    // DSTN 단위로 변환
    return {
      totalStaked: weiToDstn(totalStakedWei),
      totalStakedWei,
      totalValidators: data.totalValidators,
      activeValidators: data.activeValidators,
      totalRewards: weiToDstn(totalRewardsWei),
      totalRewardsWei,
      totalSlashed: weiToDstn(totalSlashedWei),
      totalSlashedWei,
      minStake: weiToDstn(minStakeWei),
      minStakeWei,
      maxValidators: data.maxValidators,
      withdrawalDelay,
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
}

