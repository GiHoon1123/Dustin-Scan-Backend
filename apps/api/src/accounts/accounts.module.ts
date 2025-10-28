import { ChainClientModule } from '@app/chain-client';
import { Transaction } from '@app/database';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), ChainClientModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
