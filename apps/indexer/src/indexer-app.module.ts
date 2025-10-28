import { Account, Block, Transaction, TransactionReceipt } from '@app/database';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
        entities: [Block, Transaction, TransactionReceipt, Account],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        // 개발 환경에서는 매번 DB 스키마 초기화
        dropSchema: process.env.NODE_ENV === 'development',
        logging: config.get('DB_LOGGING') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([Block, Transaction, TransactionReceipt, Account]),
    SharedModule,
  ],
  controllers: [IndexerController],
  providers: [BlockIndexerService],
})
export class IndexerAppModule {}
