import { ChainClientModule } from '@app/chain-client';
import { Module } from '@nestjs/common';
import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';

@Module({
  imports: [ChainClientModule],
  controllers: [StakingController],
  providers: [StakingService],
})
export class StakingModule {}



