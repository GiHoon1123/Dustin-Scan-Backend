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
import { AccountsModule } from './accounts/accounts.module';
import { BlocksModule } from './blocks/blocks.module';
import { ContractsModule } from './contracts/contracts.module';
import { HealthController } from './health/health.controller';
import { StablecoinModule } from './stablecoin/stablecoin.module';
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
        entities: [Block, Transaction, TransactionReceipt, Contract, Token, TokenTransfer],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        // 개발 환경에서도, 명시적으로 DB_DROP_SCHEMA=true일 때만 스키마 드랍
        // dropSchema:
        //   process.env.NODE_ENV === 'development' && config.get('DB_DROP_SCHEMA') === 'true',
        logging: false, // DB 쿼리 로깅 비활성화
      }),
    }),
    SharedModule,
    TerminusModule,
    BlocksModule,
    TransactionsModule,
    AccountsModule,
    ContractsModule,
    StablecoinModule,
  ],
  controllers: [HealthController],
})
export class ApiAppModule {}
