import { ApiProperty } from '@nestjs/swagger';

export class BlockResponseDto {
  @ApiProperty()
  hash: string;

  @ApiProperty()
  number: number;

  @ApiProperty()
  timestamp: string; // ISO date

  @ApiProperty()
  parentHash: string;

  @ApiProperty()
  proposer: string;

  @ApiProperty()
  transactionCount: number;

  @ApiProperty()
  stateRoot: string;

  @ApiProperty()
  transactionsRoot: string;

  @ApiProperty()
  receiptsRoot: string;

  @ApiProperty()
  createdAt: string;
}
