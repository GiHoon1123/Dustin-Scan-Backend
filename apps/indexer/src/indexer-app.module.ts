import {
  Block,
  Contract,
  Token,
  TokenTransfer,
  Transaction,
  TransactionReceipt,
} from '@app/database';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { IndexerController } from './indexer.controller';
import { BlockIndexerService } from './services/block-indexer.service';

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
        entities: [Block, Transaction, TransactionReceipt, Contract, Token, TokenTransfer],
        // Indexer는 스키마를 건드리지 않고, 이미 만들어진 테이블만 사용
        synchronize: false,
        dropSchema: false,
        logging: false, // DB 쿼리 로깅 비활성화
      }),
    }),
    TypeOrmModule.forFeature([
      Block,
      Transaction,
      TransactionReceipt,
      Contract,
      Token,
      TokenTransfer,
    ]),
    SharedModule,
    TerminusModule,
  ],
  controllers: [IndexerController, HealthController],
  providers: [BlockIndexerService],
})
export class IndexerAppModule {}
