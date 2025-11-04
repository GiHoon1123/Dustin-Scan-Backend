import { ChainClientService } from '@app/chain-client';
import { ChainBlockDto } from '@app/common';
import { Block } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';

/**
 * Chain Syncer Service
 *
 * Dustin-Chain에서 블록을 가져와서 Indexer Server로 전달하는 서비스
 *
 * 동작 방식:
 * 1. 1초마다 Cron 실행
 * 2. DB에서 마지막 처리된 블록 번호 조회
 * 3. 다음 블록을 Chain에서 가져오기
 * 4. Indexer Server에 HTTP POST로 전달
 * 5. 성공하면 다음 블록으로 진행, 실패하면 재시도
 *
 * 특징:
 * - 순차 처리: 블록 순서 보장
 * - 중복 방지: 이미 실행 중이면 스킵
 * - 자동 재시도: 실패한 블록은 다음 크론에서 재시도
 */
@Injectable()
export class ChainSyncerService {
  private readonly logger = new Logger(ChainSyncerService.name);
  private isProcessing = false; // 중복 실행 방지 플래그
  private readonly indexerUrl: string;

  constructor(
    @InjectRepository(Block)
    private readonly blockRepo: Repository<Block>,
    private readonly chainClient: ChainClientService,
    private readonly configService: ConfigService,
  ) {
    // Indexer Server URL 설정 (환경변수에서 가져오기)
    this.indexerUrl = this.configService.get<string>('INDEXER_URL') || 'http://localhost:4001';

    this.logger.log(`Chain Syncer initialized. Indexer URL: ${this.indexerUrl}`);
  }

  /**
   * 블록 동기화 Cron Job
   *
   * 1초마다 실행되지만, 이전 작업이 끝나지 않으면 스킵됨
   *
   * 실행 순서:
   * 1. Lock 체크 (이미 실행 중이면 스킵)
   * 2. 다음 처리할 블록 번호 계산
   * 3. Chain에서 블록 가져오기
   * 4. Indexer에게 전달
   * 5. 성공/실패 로그
   */
  @Cron(CronExpression.EVERY_SECOND)
  // @Cron(CronExpression.EVERY_30_SECONDS)
  async syncNextBlock() {
    // 이미 처리 중이면 스킵 (중복 실행 방지)
    if (this.isProcessing) {
      this.logger.debug('Previous sync still in progress, skipping...');
      return;
    }

    try {
      // Lock 설정
      this.isProcessing = true;

      // 다음 처리할 블록 번호 계산
      const nextBlockNumber = await this.getNextBlockNumber();

      // Chain에서 블록 가져오기
      const blockData = await this.fetchBlock(nextBlockNumber);

      if (!blockData) {
        // 블록이 아직 생성되지 않았으면 조용히 대기
        this.logger.log(`Block #${nextBlockNumber} not available yet`);
        return;
      }

      this.logger.log(`Syncing block #${nextBlockNumber}...`);

      // Indexer에게 블록 전달
      await this.sendToIndexer(blockData);
    } catch (error) {
      this.logger.error(`Failed to sync block: ${error.message}`);
      // 다음 크론에서 재시도하므로 예외를 던지지 않음
    } finally {
      // Lock 해제
      this.isProcessing = false;
    }
  }

  /**
   * 다음 처리할 블록 번호 계산
   *
   * DB에서 가장 마지막에 저장된 블록 번호를 조회하고
   * 그 다음 번호를 반환
   *
   * DB가 비어있으면 0번 블록부터 시작
   *
   * @returns 다음 처리할 블록 번호
   */
  private async getNextBlockNumber(): Promise<number> {
    // TypeORM 0.3+ 에서는 find + take 사용
    const blocks = await this.blockRepo.find({
      order: { number: 'DESC' },
      take: 1,
      select: ['number'],
    });

    if (blocks.length === 0) {
      // DB가 비어있으면 0번 블록부터 시작
      return 0;
    }

    // 마지막 블록 다음 번호
    return Number(blocks[0].number) + 1;
  }

  /**
   * Chain에서 블록 데이터 가져오기
   *
   * @param blockNumber - 가져올 블록 번호
   * @returns 블록 데이터 또는 null (블록이 없으면)
   */
  private async fetchBlock(blockNumber: number): Promise<ChainBlockDto | null> {
    try {
      const blockData = await this.chainClient.getBlockByNumber(blockNumber);
      // null이면 블록이 아직 생성되지 않음 (정상 상황, 조용히 스킵)
      return blockData;
    } catch (error: any) {
      // ChainClientService에서 이미 404는 null로 처리했지만, 추가 안전장치
      if (error.response?.status === 404) {
        return null;
      }
      // 그 외 에러는 로그만 남기고 다음 크론에서 재시도
      this.logger.error(`Failed to fetch block #${blockNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Indexer Server에 블록 데이터 전달
   *
   * HTTP POST로 블록 데이터를 전달하고
   * 성공/실패 응답을 받음
   *
   * 타임아웃: 30초
   * 실패시 예외 던짐 (재시도는 다음 크론에서)
   *
   * @param blockData - 전달할 블록 데이터
   * @throws Indexer가 실패 응답하거나 네트워크 에러 발생시
   */
  private async sendToIndexer(blockData: ChainBlockDto): Promise<void> {
    const blockNumber = parseInt(blockData.number, 16);

    try {
      const response = await axios.post(`${this.indexerUrl}/indexer/process-block`, blockData, {
        timeout: 30000, // 30초 타임아웃
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Indexer가 실패 응답을 보낸 경우
      if (!response.data.success) {
        throw new Error(`Indexer failed to process block: ${response.data.error}`);
      }
    } catch (error) {
      // HTTP 에러 또는 Indexer 처리 실패
      this.logger.error(`Failed to send block #${blockNumber} to indexer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync 서비스 상태 조회
   *
   * 헬스체크 또는 모니터링용
   *
   * @returns 현재 상태 정보
   */
  async getStatus() {
    const blocks = await this.blockRepo.find({
      order: { number: 'DESC' },
      take: 1,
      select: ['number', 'hash', 'timestamp'],
    });

    const lastBlock = blocks.length > 0 ? blocks[0] : null;

    return {
      isProcessing: this.isProcessing,
      lastSyncedBlock: lastBlock
        ? {
            number: lastBlock.number,
            hash: lastBlock.hash,
            timestamp: lastBlock.timestamp,
          }
        : null,
      indexerUrl: this.indexerUrl,
    };
  }
}
