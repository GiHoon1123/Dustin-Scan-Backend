import { ApiProperty } from '@nestjs/swagger';

export class TokenBalanceDto {
  @ApiProperty({
    description: '토큰 컨트랙트 주소',
    example: '0xTokenAddress...',
  })
  tokenAddress: string;

  @ApiProperty({
    description: '토큰 이름 (없을 수 있음)',
    example: 'Dustin Token',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: '토큰 심볼 (없을 수 있음)',
    example: 'DSTN',
    nullable: true,
  })
  symbol: string | null;

  @ApiProperty({
    description: '소수점 자리수 (decimals, 없을 수 있음)',
    example: 18,
    nullable: true,
  })
  decimals: number | null;

  @ApiProperty({
    description: '잔액 (정수 문자열, Wei 또는 토큰 최소 단위)',
    example: '123000000000000000000',
  })
  balance: string;
}


