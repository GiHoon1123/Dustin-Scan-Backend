import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * 네이티브 토큰 전송 요청 DTO
 */
export class TransferNativeRequestDto {
  @ApiProperty({
    description: '사용자 개인키',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'privateKey must be a valid private key',
  })
  privateKey: string;

  @ApiProperty({
    description: '수신자 주소',
    example: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'to must be a valid Ethereum address',
  })
  to: string;

  @ApiProperty({
    description: '전송할 금액 (DSTN 단위, 10진수 문자열, 소수점 지원)',
    example: '10',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'amount must be a decimal DSTN string (e.g., "10" or "0.5")',
  })
  amount: string;
}

/**
 * 트랜잭션 결과 응답 DTO (반영 확인 포함)
 */
export class TransactionResultResponseDto {
  @ApiProperty({
    description: '트랜잭션 해시',
    example: '0x1234567890abcdef...',
  })
  hash: string;

  @ApiProperty({
    description: '트랜잭션 상태 (confirmed: 블록에 반영됨, failed: 실패, pending: 대기 중)',
    example: 'confirmed',
    enum: ['confirmed', 'failed', 'pending'],
  })
  status: 'confirmed' | 'failed' | 'pending';

  @ApiProperty({
    description: '블록 번호 (반영된 경우)',
    example: '12345',
    required: false,
  })
  blockNumber?: string;

  @ApiProperty({
    description: '블록 해시 (반영된 경우)',
    example: '0xabcdef123456...',
    required: false,
  })
  blockHash?: string;
}





