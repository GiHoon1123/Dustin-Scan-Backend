import {
  Contract,
  ContractMethod,
  ContractMethodRepository,
  ContractRepository,
} from '@app/database';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractMethod]),
    SharedModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService, ContractRepository, ContractMethodRepository],
})
export class ContractsModule {}

