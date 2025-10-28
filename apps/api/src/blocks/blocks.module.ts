import {
  Block,
  BlockRepository,
  Transaction,
  TransactionReceipt,
  TransactionReceiptRepository,
  TransactionRepository,
} from '@app/database';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Block, Transaction, TransactionReceipt])],
  controllers: [BlocksController],
  providers: [BlocksService, BlockRepository, TransactionRepository, TransactionReceiptRepository],
})
export class BlocksModule {}
