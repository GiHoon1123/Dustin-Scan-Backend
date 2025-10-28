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
  imports: [TypeOrmModule.forFeature([Transaction, TransactionReceipt])],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository, TransactionReceiptRepository],
})
export class TransactionsModule {}
