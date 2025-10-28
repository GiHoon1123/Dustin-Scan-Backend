import {
  ChainAccountDto,
  ChainBlockDto,
  ChainReceiptDto,
  ChainStatsDto,
  ChainTransactionDto,
} from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Dustin-Chain RPC 클라이언트
 *
 * Dustin-Chain (localhost:3000)과 통신하는 HTTP 클라이언트
 *
 * 주요 기능:
 * - 블록 조회 (latest, by number, by hash)
 * - 트랜잭션 조회
 * - 계정 조회
 * - 체인 통계 조회
 */
@Injectable()
export class ChainClientService {
  private readonly logger = new Logger(ChainClientService.name);
  private readonly client: AxiosInstance;
  private readonly chainUrl: string;

  constructor() {
    this.chainUrl = process.env.CHAIN_URL;

    if (!this.chainUrl) {
      throw new Error('CHAIN_URL environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.chainUrl,
      timeout: 10000, // 10초 타임아웃
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Chain Client initialized: ${this.chainUrl}`);
  }

  /**
   * 최신 블록 조회
   *
   * GET /block/latest
   */
  async getLatestBlock(): Promise<ChainBlockDto> {
    try {
      const response = await this.client.get<ChainBlockDto>('/block/latest');
      this.logger.debug(`Fetched latest block: #${parseInt(response.data.number, 16)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch latest block', error);
      throw error;
    }
  }

  /**
   * 블록 번호로 조회
   *
   * GET /block/number/:number
   */
  async getBlockByNumber(blockNumber: number): Promise<ChainBlockDto> {
    try {
      const response = await this.client.get<ChainBlockDto>(`/block/number/${blockNumber}`);
      this.logger.debug(`Fetched block #${blockNumber}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch block #${blockNumber}`, error);
      throw error;
    }
  }

  /**
   * 블록 해시로 조회
   *
   * GET /block/hash/:hash
   */
  async getBlockByHash(blockHash: string): Promise<ChainBlockDto> {
    try {
      const response = await this.client.get<ChainBlockDto>(`/block/hash/${blockHash}`);
      this.logger.debug(`Fetched block ${blockHash}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch block ${blockHash}`, error);
      throw error;
    }
  }

  /**
   * 체인 통계 조회
   *
   * GET /block/stats
   */
  async getChainStats(): Promise<ChainStatsDto> {
    try {
      const response = await this.client.get<ChainStatsDto>('/block/stats');
      this.logger.debug(
        `Fetched chain stats: height=${response.data.height}, txs=${response.data.totalTransactions}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch chain stats', error);
      throw error;
    }
  }

  /**
   * 트랜잭션 조회
   *
   * GET /transaction/:hash
   */
  async getTransaction(txHash: string): Promise<ChainTransactionDto> {
    try {
      const response = await this.client.get<ChainTransactionDto>(`/transaction/${txHash}`);
      this.logger.debug(`Fetched transaction ${txHash}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch transaction ${txHash}`, error);
      throw error;
    }
  }

  /**
   * 트랜잭션 Receipt 조회
   *
   * GET /transaction/:hash/receipt
   *
   * Receipt는 트랜잭션 실행 결과 정보:
   * - status: 성공(1) / 실패(0)
   * - gasUsed: 사용된 Gas
   * - logs: 이벤트 로그
   *
   * @param txHash 트랜잭션 해시
   * @returns Receipt 정보 (없으면 null)
   */
  async getReceipt(txHash: string): Promise<ChainReceiptDto | null> {
    try {
      const response = await this.client.get<ChainReceiptDto | null>(
        `/transaction/${txHash}/receipt`,
      );
      if (!response.data) {
        this.logger.debug(`No receipt found for transaction ${txHash} (pending)`);
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch receipt for transaction ${txHash}`, error);
      throw error;
    }
  }

  /**
   * 계정 정보 조회
   *
   * GET /account/:address
   */
  async getAccount(address: string): Promise<ChainAccountDto> {
    try {
      const response = await this.client.get<ChainAccountDto>(`/account/${address}`);
      this.logger.debug(`Fetched account ${address}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch account ${address}`, error);
      throw error;
    }
  }

  /**
   * 헬스 체크 (체인 연결 확인)
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getChainStats();
      return true;
    } catch (error) {
      this.logger.error('Chain health check failed', error);
      return false;
    }
  }

  /**
   * 최신 블록 번호만 조회 (빠른 동기화용)
   */
  async getLatestBlockNumber(): Promise<number> {
    const stats = await this.getChainStats();
    return stats.latestBlockNumber;
  }
}
