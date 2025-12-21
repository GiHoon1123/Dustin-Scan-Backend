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
    description: '잔액 (토큰 단위, 사용자 친화적)',
    example: '123.0',
  })
  balance: string; // 토큰 단위

  @ApiProperty({
    description: '잔액 (토큰 최소 단위, 원본 데이터)',
    example: '123000000000000000000',
  })
  balanceWei: string; // 토큰 최소 단위 (Wei와 유사)
}


