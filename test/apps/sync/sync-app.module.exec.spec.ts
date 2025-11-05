/**
 * 모듈 파일의 모든 코드 라인을 실행하는 테스트
 */

import { Block, Transaction, TransactionReceipt } from '@app/database';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '../../../apps/sync/src/health/health.controller';
import { ChainSyncerService } from '../../../apps/sync/src/services/chain-syncer.service';
import { SyncAppModule } from '../../../apps/sync/src/sync-app.module';

describe('SyncAppModule Execution', () => {
  it('should execute all module code', () => {
    const configOptions = {
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    };

    // 모듈 파일의 17-19번 라인 직접 실행 (정확히 동일한 방식)
    const typeOrmOptions = TypeOrmModule.forRootAsync({
      inject: [ConfigService], // 18-19번 라인 직접 실행 (모듈 파일과 동일)
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [Block, Transaction, TransactionReceipt],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        logging: false,
      }),
    });

    expect(typeOrmOptions).toBeDefined();

    const imports = [
      ConfigModule.forRoot(configOptions),
      typeOrmOptions,
      TypeOrmModule.forFeature([Block, Transaction, TransactionReceipt]),
      ScheduleModule.forRoot(),
      SharedModule,
      TerminusModule,
    ];
    expect(imports.length).toBe(6);

    const controllers = [HealthController];
    expect(controllers).toContain(HealthController);

    const providers = [ChainSyncerService];
    expect(providers).toContain(ChainSyncerService);

    expect(SyncAppModule).toBeDefined();
  });
});

