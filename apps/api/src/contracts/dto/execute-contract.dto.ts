import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

/**
 * 컨트랙트 메서드 실행 요청 DTO
 *
 * 프론트엔드에서 메서드 이름과 파라미터만 전달하면,
 * 백엔드에서 ABI를 조회하여 인코딩하고 코어에 전달합니다.
 */
export class ExecuteContractDto {
  @ApiProperty({
    description: '호출할 메서드 이름',
    example: 'setValue',
  })
  @IsString()
  @IsNotEmpty()
  methodName: string;

  @ApiProperty({
    description: '메서드 파라미터 배열 (순서대로)',
    example: ['42'],
    type: [String],
  })
  @IsArray()
  params: any[];
}

/**
 * 컨트랙트 실행 응답 DTO
 */
export class ExecuteContractResponseDto {
  @ApiProperty({ description: '트랜잭션 해시', example: '0x123...' })
  transactionHash: string;

  @ApiProperty({ description: '트랜잭션 상태', example: 'pending' })
  status: string;
}

