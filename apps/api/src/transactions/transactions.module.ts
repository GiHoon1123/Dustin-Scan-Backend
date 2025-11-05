import { ChainClientModule } from '@app/chain-client';
import {
  Transaction,
  TransactionReceipt,
  TransactionReceiptRepository,
  TransactionRepository,
} from '@app/database';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionReceipt]),
    ChainClientModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository, TransactionReceiptRepository],
})
export class TransactionsModule {}
