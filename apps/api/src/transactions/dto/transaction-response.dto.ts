import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty()
  hash: string;

  @ApiProperty()
  blockHash: string;

  @ApiProperty()
  blockNumber: number;

  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  value: string; // wei

  @ApiProperty()
  nonce: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: string; // ISO date

  @ApiProperty()
  createdAt: string;
}
