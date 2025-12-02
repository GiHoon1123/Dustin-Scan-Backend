import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Database Cleanup Scheduler
 *
 * 매일 밤 11시(23:00)에 모든 테이블 데이터를 삭제합니다.
 * 서버 저장공간 부족 문제를 해결하기 위한 임시 조치입니다.
 */
@Injectable()
export class DatabaseCleanupScheduler {
  private readonly logger = new Logger(DatabaseCleanupScheduler.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 매일 밤 11시(23:00)에 실행
   * Cron 표현식: '0 23 * * *' (매일 23시 0분)
   */
  @Cron('0 23 * * *', {
    name: 'database-cleanup',
    timeZone: 'Asia/Seoul', // 한국 시간 기준
  })
  async handleCron(): Promise<void> {
    await this.cleanupDatabase();
  }

  /**
   * 데이터베이스 정리 (수동 실행 가능)
   * 외부에서 호출 가능하도록 public 메서드로 분리
   */
  async cleanupDatabase(): Promise<void> {
    this.logger.warn('🗑️  Starting database cleanup at 23:00...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 외래키 제약조건을 무시하고 TRUNCATE 사용 (더 빠르고 안전)
      // CASCADE 옵션으로 관련 테이블도 함께 삭제
      await queryRunner.query('TRUNCATE TABLE token_transfers CASCADE');
      this.logger.log('✅ Cleared token_transfers');

      await queryRunner.query('TRUNCATE TABLE transaction_receipts CASCADE');
      this.logger.log('✅ Cleared transaction_receipts');

      await queryRunner.query('TRUNCATE TABLE transactions CASCADE');
      this.logger.log('✅ Cleared transactions');

      await queryRunner.query('TRUNCATE TABLE contracts CASCADE');
      this.logger.log('✅ Cleared contracts');

      await queryRunner.query('TRUNCATE TABLE tokens CASCADE');
      this.logger.log('✅ Cleared tokens');

      await queryRunner.query('TRUNCATE TABLE blocks CASCADE');
      this.logger.log('✅ Cleared blocks');

      await queryRunner.commitTransaction();
      this.logger.warn('✅ Database cleanup completed successfully');
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Database cleanup failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

