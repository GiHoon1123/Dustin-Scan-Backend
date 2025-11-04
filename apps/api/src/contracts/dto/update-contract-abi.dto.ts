import { ApiProperty } from '@nestjs/swagger';

/**
 * 컨트랙트 ABI 업데이트 요청 DTO
 * 
 * ValidationPipe를 우회하기 위해 validation 데코레이터를 제거했습니다.
 * 서비스 레이어에서 수동 검증을 수행합니다.
 */
export class UpdateContractAbiDto {
  @ApiProperty({
    description: '컨트랙트 ABI (JSON 배열, Remix IDE에서 복사한 형식)',
    example: [
      {
        inputs: [],
        name: 'getOwner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    required: false,
  })
  abi?: any[];

  @ApiProperty({
    description: '컨트랙트 바이트코드 (검증용, 옵셔널)',
    example: '0x608060405234801561000f575f5ffd5b...',
    required: false,
  })
  bytecode?: string;

  @ApiProperty({
    description: '컨트랙트 이름 (옵셔널)',
    example: 'MyContract',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: '컨트랙트 소스 코드 (옵셔널)',
    required: false,
  })
  sourceCode?: string;

  @ApiProperty({
    description: '컴파일러 버전 (옵셔널)',
    example: '0.8.20',
    required: false,
  })
  compilerVersion?: string;

  @ApiProperty({
    description: '최적화 설정 (옵셔널)',
    example: true,
    required: false,
  })
  optimization?: boolean;
}

