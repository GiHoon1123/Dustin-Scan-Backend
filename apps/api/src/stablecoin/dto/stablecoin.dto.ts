import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * 담보 예치 요청 DTO
 */
export class DepositCollateralRequestDto {
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
    description: '예치할 금액 (DSTN 단위, 10진수 문자열, 소수점 지원)',
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
 * 스테이블코인 발행 요청 DTO
 */
export class MintStablecoinRequestDto {
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
    description: '발행할 스테이블코인 양 (DSTN 단위, 10진수 문자열, 소수점 지원)',
    example: '500',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'stablecoinAmount must be a decimal DSTN string (e.g., "500" or "0.5")',
  })
  stablecoinAmount: string;
}

/**
 * 스테이블코인 상환 요청 DTO
 */
export class RedeemStablecoinRequestDto {
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
    description: '상환할 스테이블코인 양 (DSTN 단위, 10진수 문자열, 소수점 지원)',
    example: '200',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'stablecoinAmount must be a decimal DSTN string (e.g., "200" or "0.5")',
  })
  stablecoinAmount: string;
}

/**
 * 담보 인출 요청 DTO
 */
export class WithdrawCollateralRequestDto {
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
    description: '인출할 금액 (DSTN 단위, 10진수 문자열, 소수점 지원)',
    example: '0.5',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'amount must be a decimal DSTN string (e.g., "10" or "0.5")',
  })
  amount: string;
}

/**
 * 청산 요청 DTO
 */
export class LiquidateRequestDto {
  @ApiProperty({
    description: '청산 실행자 개인키',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'privateKey must be a valid private key',
  })
  privateKey: string;

  @ApiProperty({
    description: '청산 대상 사용자 주소',
    example: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'userAddress must be a valid Ethereum address',
  })
  userAddress: string;
}

/**
 * 트랜잭션 응답 DTO
 */
export class TransactionResponseDto {
  @ApiProperty({
    description: '트랜잭션 해시',
    example: '0x1234567890abcdef...',
  })
  hash: string;

  @ApiProperty({
    description: '트랜잭션 상태',
    example: 'pending',
  })
  status: string;
}

/**
 * 포지션 조회 응답 DTO (디코딩된 값)
 */
export class PositionResponseDto {
  @ApiProperty({
    description: '담보 양 (DSTN 단위, 사용자 친화적)',
    example: '1000.0',
  })
  collateralAmount: string; // DSTN 단위

  @ApiProperty({
    description: '담보 양 (Wei 단위, 원본 데이터)',
    example: '1000000000000000000000',
  })
  collateralAmountWei: string; // Wei 단위

  @ApiProperty({
    description: '부채 양 (DSTN 단위, 사용자 친화적)',
    example: '500.0',
  })
  debtAmount: string; // DSTN 단위

  @ApiProperty({
    description: '부채 양 (Wei 단위, 원본 데이터)',
    example: '500000000000000000000',
  })
  debtAmountWei: string; // Wei 단위

  @ApiProperty({
    description: '담보비율 (배수, decimal string). 코어에서 비율만 반환 (예: 1243 = 1,243배 = 124,300%)',
    example: '1243',
  })
  collateralRatio: string;
}

/**
 * 건강도 조회 응답 DTO (디코딩된 값)
 */
export class HealthResponseDto {
  @ApiProperty({
    description: '건강도 여부 (boolean)',
    example: true,
  })
  isHealthy: boolean;
}

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
 * 스테이블코인 전송 요청 DTO
 */
export class TransferStablecoinRequestDto {
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
    description: '전송할 스테이블코인 양 (DSTN 단위, 10진수 문자열, 소수점 지원)',
    example: '100',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'amount must be a decimal DSTN string (e.g., "100" or "0.5")',
  })
  amount: string;
}

/**
 * 스테이블코인 잔액 응답 DTO
 */
export class StablecoinBalanceResponseDto {
  @ApiProperty({
    description: '스테이블코인 잔액 (토큰 단위, 사용자 친화적)',
    example: '100.0',
  })
  balance: string;

  @ApiProperty({
    description: '스테이블코인 잔액 (smallest unit, 원본)',
    example: '100000000000000000000',
  })
  balanceSmallestUnit: string;
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


