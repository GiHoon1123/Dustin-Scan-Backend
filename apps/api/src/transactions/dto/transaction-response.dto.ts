import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 트랜잭션 조회 응답 DTO
 *
 * Transaction + TransactionReceipt 정보 결합
 * - 기본 트랜잭션 정보 (hash, from, to, value 등)
 * - Receipt 정보 (status, gasUsed 등)
 */
export class TransactionResponseDto {
  @ApiProperty({ description: '트랜잭션 해시' })
  hash: string;

  @ApiProperty({ description: '블록 해시' })
  blockHash: string;

  @ApiProperty({ description: '블록 번호' })
  blockNumber: string;

  @ApiProperty({ description: '송신자 주소' })
  from: string;

  @ApiProperty({ description: '수신자 주소' })
  to: string;

  @ApiProperty({ description: '전송 금액 (DSTN 단위)', example: '10.0' })
  value: string; // DSTN 단위

  @ApiProperty({ description: '전송 금액 (Wei 단위)', example: '10000000000000000000' })
  valueWei: string; // Wei 단위

  @ApiProperty({ description: 'Nonce' })
  nonce: number;

  @ApiProperty({ description: '타임스탬프 (Unix milliseconds)' })
  timestamp: string;

  // Receipt 정보
  @ApiPropertyOptional({ description: '트랜잭션 상태 (1: 성공, 0: 실패)', example: 1 })
  status?: number;

  @ApiPropertyOptional({ description: '사용된 Gas (Wei 단위)', example: '21000' })
  gasUsed?: string;

  @ApiPropertyOptional({ description: '누적 Gas 사용량 (Wei 단위)', example: '42000' })
  cumulativeGasUsed?: string;

  @ApiPropertyOptional({ description: '배포된 컨트랙트 주소 (컨트랙트 배포 트랜잭션인 경우)' })
  contractAddress?: string | null;

  @ApiProperty({ description: '생성 시각' })
  createdAt: string;
}
