import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/**
 * 컨트랙트 배포 요청 DTO
 */
export class DeployContractDto {
  @ApiProperty({
    description: '컨트랙트 바이트코드 (컴파일된 hex string)',
    example: '0x608060405234801561000f575f5ffd5b...',
    pattern: '^0x[a-fA-F0-9]*$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]*$/, {
    message: 'bytecode must be a valid hex string starting with 0x',
  })
  bytecode: string;
}

/**
 * 컨트랙트 배포 응답 DTO
 */
export class DeployContractResponseDto {
  @ApiProperty({
    description: '트랜잭션 해시',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  transactionHash: string;

  @ApiProperty({
    description: '트랜잭션 상태 (pending: Pool에 추가됨)',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: '컨트랙트 주소 (아직 블록에 포함되지 않아서 null, 나중에 Receipt에서 확인)',
    example: null,
    required: false,
  })
  contractAddress: string | null;
}

