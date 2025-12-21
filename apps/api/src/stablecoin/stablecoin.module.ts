import { ChainClientModule } from '@app/chain-client';
import { Module } from '@nestjs/common';
import { StablecoinController } from './stablecoin.controller';
import { StablecoinService } from './stablecoin.service';

@Module({
  imports: [ChainClientModule],
  controllers: [StablecoinController],
  providers: [StablecoinService],
})
export class StablecoinModule {}


