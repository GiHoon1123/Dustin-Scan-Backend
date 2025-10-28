import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database.config';
import { Account } from './entities/account.entity';
import { Block } from './entities/block.entity';
import { Transaction } from './entities/transaction.entity';

/**
 * Database 모듈
 *
 * TypeORM + PostgreSQL 설정
 * 모든 앱에서 공통으로 사용
 */
@Module({
  imports: [
    // TypeORM Root 설정
    TypeOrmModule.forRoot(databaseConfig),

    // Entity Repository 등록
    TypeOrmModule.forFeature([Block, Transaction, Account]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
