import { Module } from '@nestjs/common';
import { ChainClientService } from './chain-client.service';

@Module({
  providers: [ChainClientService],
  exports: [ChainClientService],
})
export class ChainClientModule {}
