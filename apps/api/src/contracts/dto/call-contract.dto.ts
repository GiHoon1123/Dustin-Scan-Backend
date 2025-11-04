import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

/**
 * 컨트랙트 읽기 메서드 호출 요청 DTO
 *
 * view, pure 함수 호출용 (상태 변경 없음)
 */
export class CallContractDto {
  @ApiProperty({
    description: '호출할 메서드 이름',
    example: 'getValue',
  })
  @IsString()
  @IsNotEmpty()
  methodName: string;

  @ApiProperty({
    description: '메서드 파라미터 배열 (순서대로)',
    example: [],
    type: [String],
  })
  @IsArray()
  params: any[];
}

/**
 * 컨트랙트 읽기 메서드 호출 응답 DTO
 */
export class CallContractResponseDto {
  @ApiProperty({
    description: '함수 실행 결과 (ABI 인코딩된 hex string)',
    example: '0x000000000000000000000000000000000000000000000000000000000000002a',
  })
  result: string;

  @ApiProperty({ description: '사용한 가스', example: '0x5208' })
  gasUsed: string;

  @ApiProperty({
    description: '디코딩된 결과 (타입에 따라 자동 변환)',
    example: '42',
  })
  decodedResult?: any;
}

