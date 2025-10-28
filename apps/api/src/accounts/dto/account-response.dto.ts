import { ApiProperty } from '@nestjs/swagger';

/**
 * 계정 조회 응답 DTO
 *
 * 실시간 RPC 조회 데이터를 기반으로 생성
 * - balance: DSTN 단위 (사용자 친화적)
 * - balanceWei: Wei 단위 (원본 데이터)
 */
export class AccountResponseDto {
  @ApiProperty({ description: '계정 주소 (0x...)' })
  address: string;

  @ApiProperty({ description: '잔액 (DSTN 단위)', example: '1000.0' })
  balance: string; // DSTN 단위

  @ApiProperty({ description: '잔액 (Wei 단위)', example: '1000000000000000000000' })
  balanceWei: string; // Wei 단위 (원본)

  @ApiProperty({ description: 'Nonce (전송한 트랜잭션 개수)', example: 5 })
  nonce: number;

  @ApiProperty({ description: '관련 트랜잭션 개수 (송신 + 수신)', example: 10 })
  txCount: number;
}
