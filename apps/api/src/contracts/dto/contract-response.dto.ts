import { ApiProperty } from '@nestjs/swagger';

/**
 * 컨트랙트 정보 응답 DTO
 */
export class ContractResponseDto {
  @ApiProperty({
    description: '컨트랙트 주소',
    example: '0x1234567890123456789012345678901234567890',
  })
  address: string;

  @ApiProperty({
    description: '배포한 계정 주소',
    example: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
  })
  deployer: string;

  @ApiProperty({
    description: '배포 트랜잭션 해시',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  transactionHash: string;

  @ApiProperty({
    description: '배포된 블록 번호',
    example: '1000',
  })
  blockNumber: string;

  @ApiProperty({
    description: '배포된 블록 해시',
  })
  blockHash: string;

  @ApiProperty({
    description: '컨트랙트 바이트코드',
    example: '0x608060405234801561000f575f5ffd5b...',
    required: false,
  })
  bytecode: string | null;

  @ApiProperty({
    description: '컨트랙트 ABI',
    required: false,
  })
  abi: any[] | null;

  @ApiProperty({
    description: '컨트랙트 이름',
    required: false,
  })
  name: string | null;

  @ApiProperty({
    description: '소스 코드',
    required: false,
  })
  sourceCode: string | null;

  @ApiProperty({
    description: '컴파일러 버전',
    required: false,
  })
  compilerVersion: string | null;

  @ApiProperty({
    description: '최적화 설정',
    required: false,
  })
  optimization: boolean | null;

  @ApiProperty({
    description: '배포 시간 (Unix timestamp)',
    example: '1730000000',
  })
  timestamp: string;

  @ApiProperty({
    description: '생성 시간',
    example: '2025-10-30T00:00:00.000Z',
  })
  createdAt: string;
}

