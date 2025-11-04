import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CommonResponseDto } from '../common/dto';
import { ContractsService } from './contracts.service';
import { ContractResponseDto } from './dto/contract-response.dto';
import { DeployContractDto, DeployContractResponseDto } from './dto/deploy-contract.dto';
import { UpdateContractAbiDto } from './dto/update-contract-abi.dto';

@ApiTags('컨트랙트 (Contracts)')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':address')
  @ApiOperation({
    summary: '컨트랙트 정보 조회',
    description: `
컨트랙트 주소로 컨트랙트 정보를 조회합니다.

**포함 정보:**
- 기본 정보 (주소, 배포자, 트랜잭션 해시 등)
- 바이트코드 (체인에서 조회한 값)
- ABI (사용자가 등록한 경우)
- 메타데이터 (이름, 소스코드, 컴파일러 버전 등)
    `,
  })
  @ApiParam({
    name: 'address',
    description: '컨트랙트 주소',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiResponse({
    status: 200,
    description: '컨트랙트 정보 조회 성공',
    type: ContractResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '컨트랙트를 찾을 수 없음',
  })
  async getContract(
    @Param('address') address: string,
  ): Promise<CommonResponseDto<ContractResponseDto>> {
    const contract = await this.contractsService.getContract(address);
    return CommonResponseDto.success(contract, '컨트랙트 정보 조회 성공');
  }

  @Post('deploy')
  @ApiOperation({
    summary: '컨트랙트 배포',
    description: `
컨트랙트 바이트코드를 받아서 코어에 배포합니다.

**동작 순서:**
1. 바이트코드를 코어의 배포 API로 전달
2. 코어가 트랜잭션 생성 및 제출 (제네시스 계정 0번 사용)
3. 트랜잭션 해시 반환
4. Indexer가 블록에 포함되면 자동으로 Contract 테이블에 저장
5. 나중에 PUT /contracts/:address/abi로 ABI 업데이트 가능

**사용 예시:**
1. UI에서 Solidity 코드 컴파일 → 바이트코드 추출
2. 이 API로 배포 (바이트코드만)
3. 트랜잭션 해시 받기
4. 블록 포함 대기 (몇 초 후)
5. GET /contracts/:address로 컨트랙트 정보 확인
6. PUT /contracts/:address/abi로 ABI 추가
    `,
  })
  @ApiResponse({
    status: 201,
    description: '컨트랙트 배포 성공',
    type: DeployContractResponseDto,
  })
  async deployContract(
    @Body() dto: DeployContractDto,
  ): Promise<CommonResponseDto<DeployContractResponseDto>> {
    const result = await this.contractsService.deployContract(dto);
    return CommonResponseDto.success(result, '컨트랙트 배포 트랜잭션 제출 성공');
  }

  @Put(':address/abi')
  @ApiOperation({
    summary: '컨트랙트 ABI 등록/업데이트',
    description: `
이미 배포된 컨트랙트에 ABI 정보를 등록하거나 업데이트합니다.

**사용 시나리오:**
1. 컨트랙트 배포 후 자동으로 Contract 테이블에 저장됨 (Indexer)
2. 사용자가 UI에서 바이트코드와 ABI를 입력
3. 이 API로 ABI 업데이트
4. 이후 컨트랙트 메서드 호출 가능

**옵셔널 필드:**
- \`abi\`: ABI JSON 배열
- \`bytecode\`: 검증용 (선택)
- \`name\`, \`sourceCode\`, \`compilerVersion\`, \`optimization\`: 메타데이터
    `,
  })
  @ApiParam({
    name: 'address',
    description: '컨트랙트 주소',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'ABI 업데이트 성공',
    type: ContractResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '컨트랙트를 찾을 수 없음',
  })
  async updateContractAbi(
    @Param('address') address: string,
    @Req() req: Request,
  ): Promise<CommonResponseDto<ContractResponseDto>> {
    // ValidationPipe를 우회하기 위해 raw body를 직접 사용
    let dto: UpdateContractAbiDto;

    // 요청 body가 배열인 경우 (직접 ABI 배열을 보낸 경우)
    if (Array.isArray(req.body)) {
      dto = { abi: req.body };
    } else {
      // 객체인 경우 그대로 사용
      dto = req.body as UpdateContractAbiDto;
    }

    const contract = await this.contractsService.updateContractAbi(address, dto);
    return CommonResponseDto.success(contract, '컨트랙트 ABI 업데이트 성공');
  }
}
