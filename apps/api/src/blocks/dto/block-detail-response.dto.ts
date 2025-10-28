import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';

/**
 * 블록 상세 조회 응답 DTO
 *
 * 블록 정보 + 포함된 트랜잭션 목록
 */
export class BlockDetailResponseDto {
  @ApiProperty({ description: '블록 해시', example: '0x1234567890abcdef...' })
  hash: string;

  @ApiProperty({ description: '블록 번호', example: '100' })
  number: string;

  @ApiProperty({ description: '타임스탬프 (Unix milliseconds)', example: '1698825600000' })
  timestamp: string;

  @ApiProperty({ description: '이전 블록 해시', example: '0xabcdef1234567890...' })
  parentHash: string;

  @ApiProperty({
    description: '블록 제안자 (Proposer) 주소',
    example: '0x742d35cc6634c0532925a3b844bc9e7595f0beb',
  })
  proposer: string;

  @ApiProperty({ description: '포함된 트랜잭션 개수', example: 5 })
  transactionCount: number;

  @ApiProperty({ description: '상태 루트 해시', example: '0x9876543210fedcba...' })
  stateRoot: string;

  @ApiProperty({ description: '트랜잭션 루트 해시', example: '0x1111222233334444...' })
  transactionsRoot: string;

  @ApiProperty({ description: 'Receipt 루트 해시', example: '0x5555666677778888...' })
  receiptsRoot: string;

  @ApiProperty({ description: '생성 시각', example: '2025-10-29T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({
    description: '블록에 포함된 트랜잭션 목록',
    type: [TransactionResponseDto],
    example: [
      {
        hash: '0xabc123...',
        blockHash: '0x1234567890abcdef...',
        blockNumber: '100',
        from: '0x742d35cc6634c0532925a3b844bc9e7595f0beb',
        to: '0x2ac26b318b1136e535abb97733a00cc8b80a5b49',
        value: '10.0',
        valueWei: '10000000000000000000',
        nonce: 5,
        timestamp: '1698825600000',
        status: 1,
        gasUsed: '21000',
        cumulativeGasUsed: '21000',
        contractAddress: null,
        createdAt: '2025-10-29T00:00:00.000Z',
      },
    ],
  })
  transactions: TransactionResponseDto[];
}
