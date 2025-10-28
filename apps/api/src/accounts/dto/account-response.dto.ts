import { ApiProperty } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty()
  address: string;

  @ApiProperty()
  balance: string; // wei

  @ApiProperty()
  nonce: number;

  @ApiProperty()
  txCount: number;

  @ApiProperty()
  lastUpdated: string;

  @ApiProperty()
  createdAt: string;
}
