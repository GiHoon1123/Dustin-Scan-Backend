import { ChainClientModule } from '@app/chain-client';
import {
  Token,
  TokenRepository,
  TokenTransfer,
  TokenTransferRepository,
  Transaction,
  TransactionRepository,
} from '@app/database';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Token, TokenTransfer]), ChainClientModule],
  controllers: [AccountsController],
  providers: [AccountsService, TransactionRepository, TokenTransferRepository, TokenRepository],
})
export class AccountsModule {}
