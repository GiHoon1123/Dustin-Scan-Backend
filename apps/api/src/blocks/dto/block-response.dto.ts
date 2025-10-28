import { ApiProperty } from '@nestjs/swagger';

/**
 * 블록 조회 응답 DTO
 */
export class BlockResponseDto {
  @ApiProperty({ description: '블록 해시' })
  hash: string;

  @ApiProperty({ description: '블록 번호' })
  number: string;

  @ApiProperty({ description: '타임스탬프 (Unix milliseconds)' })
  timestamp: string;

  @ApiProperty({ description: '이전 블록 해시' })
  parentHash: string;

  @ApiProperty({ description: '블록 제안자 (Proposer) 주소' })
  proposer: string;

  @ApiProperty({ description: '포함된 트랜잭션 개수' })
  transactionCount: number;

  @ApiProperty({ description: '상태 루트 해시' })
  stateRoot: string;

  @ApiProperty({ description: '트랜잭션 루트 해시' })
  transactionsRoot: string;

  @ApiProperty({ description: 'Receipt 루트 해시' })
  receiptsRoot: string;

  @ApiProperty({ description: '생성 시각' })
  createdAt: string;
}
