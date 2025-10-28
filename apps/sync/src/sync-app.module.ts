import { Account, Block, Transaction } from '@app/database';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainSyncerService } from './services/chain-syncer.service';

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
        entities: [Block, Transaction, Account],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        logging: config.get('DB_LOGGING') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([Block, Transaction, Account]),
    ScheduleModule.forRoot(),
    SharedModule,
  ],
  providers: [ChainSyncerService],
})
export class SyncAppModule {}
