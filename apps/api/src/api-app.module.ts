import { Block, Transaction, TransactionReceipt } from '@app/database';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from './accounts/accounts.module';
import { BlocksModule } from './blocks/blocks.module';
import { HealthController } from './health/health.controller';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [Block, Transaction, TransactionReceipt],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        // 개발 환경에서는 매번 DB 스키마 초기화 (충돌 방지를 위해 주석 처리)
        // dropSchema: process.env.NODE_ENV === 'development',
        logging: false, // DB 쿼리 로깅 비활성화
      }),
    }),
    SharedModule,
    TerminusModule,
    BlocksModule,
    TransactionsModule,
    AccountsModule,
  ],
  controllers: [HealthController],
})
export class ApiAppModule {}
