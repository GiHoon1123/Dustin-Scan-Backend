import { ApiProperty } from '@nestjs/swagger';

export class TokenTransferItemDto {
  @ApiProperty({
    description: '토큰 컨트랙트 주소',
    example: '0xTokenAddress...',
  })
  tokenAddress: string;

  @ApiProperty({
    description: '보낸 주소',
    example: '0xFromAddress...',
  })
  from: string;

  @ApiProperty({
    description: '받는 주소',
    example: '0xToAddress...',
  })
  to: string;

  @ApiProperty({
    description: '전송 값 (정수 문자열)',
    example: '1000000000000000000',
  })
  value: string;

  @ApiProperty({
    description: '블록 번호 (decimal string)',
    example: '123',
  })
  blockNumber: string;

  @ApiProperty({
    description: '트랜잭션 해시',
    example: '0xTxHash...',
  })
  transactionHash: string;

  @ApiProperty({
    description: '블록 내 로그 인덱스',
    example: 0,
  })
  logIndex: number;

  @ApiProperty({
    description: '블록 타임스탬프 (Unix time, seconds 또는 ms decimal string)',
    example: '1710000000',
  })
  timestamp: string;

  @ApiProperty({
    description: '해당 주소 기준 방향 (in / out / self)',
    example: 'in',
  })
  direction: 'in' | 'out' | 'self';
}
