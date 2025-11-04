import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CommonResponseDto, PaginatedResponseDto } from '../common/dto';
import { ContractsService } from './contracts.service';
import { CallContractDto, CallContractResponseDto } from './dto/call-contract.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { DeployContractDto, DeployContractResponseDto } from './dto/deploy-contract.dto';
import { ExecuteContractDto, ExecuteContractResponseDto } from './dto/execute-contract.dto';
import { UpdateContractAbiDto } from './dto/update-contract-abi.dto';

@ApiTags('컨트랙트 (Contracts)')
@ApiExtraModels(CommonResponseDto, ContractResponseDto, PaginatedResponseDto)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiOperation({
    summary: '컨트랙트 목록 조회',
    description: `
모든 컨트랙트 목록을 조회합니다.
- 최신 블록순으로 정렬 (blockNumber DESC)
- 페이징 지원 (최대 100개)
- 컨트랙트 기본 정보 포함
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 20, 최대: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '컨트랙트 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(ContractResponseDto) },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getContracts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<PaginatedResponseDto<ContractResponseDto>> {
    const actualLimit = Math.min(limit, 100);
    const { contracts, totalCount } = await this.contractsService.getContracts(page, actualLimit);

    return new PaginatedResponseDto(
      contracts,
      page,
      actualLimit,
      totalCount,
      '컨트랙트 목록 조회 성공',
    );
  }

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

  @Post(':address/execute')
  @ApiOperation({
    summary: '컨트랙트 메서드 실행 (상태 변경)',
    description: `
컨트랙트의 상태 변경 메서드를 실행합니다.

**동작 순서:**
1. 컨트랙트 ABI 조회 (DB에서)
2. 메서드 이름으로 ABI에서 메서드 찾기
3. 파라미터를 ABI 인코딩 (백엔드에서 처리)
4. 코어에 트랜잭션 제출 (제네시스 계정 0번 사용)
5. 트랜잭션 해시 반환

**사용 예시:**
\`\`\`json
{
  "methodName": "setValue",
  "params": ["42"]
}
\`\`\`

**주의:**
- ABI가 먼저 등록되어 있어야 합니다 (PUT /contracts/:address/abi)
- 메서드 이름은 ABI에 존재하는 함수여야 합니다
- 파라미터는 순서대로 배열로 전달합니다
- 상태 변경 메서드 (nonpayable, payable)만 가능합니다
    `,
  })
  @ApiParam({
    name: 'address',
    description: '컨트랙트 주소',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiResponse({
    status: 201,
    description: '컨트랙트 메서드 실행 성공',
    type: ExecuteContractResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ABI가 없거나 메서드를 찾을 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '컨트랙트를 찾을 수 없음',
  })
  async executeContract(
    @Param('address') address: string,
    @Body() dto: ExecuteContractDto,
  ): Promise<CommonResponseDto<ExecuteContractResponseDto>> {
    const result = await this.contractsService.executeContract(address, dto);
    return CommonResponseDto.success(result, '컨트랙트 메서드 실행 성공');
  }

  @Post(':address/call')
  @ApiOperation({
    summary: '컨트랙트 읽기 메서드 호출 (view, pure)',
    description: `
컨트랙트의 읽기 메서드를 호출합니다. 상태 변경 없이 실행되며 결과를 즉시 반환합니다.

**동작 순서:**
1. 컨트랙트 ABI 조회 (DB에서)
2. 메서드 이름으로 ABI에서 메서드 찾기
3. 파라미터를 ABI 인코딩 (백엔드에서 처리)
4. 코어에 직접 호출 (트랜잭션 없이 실행)
5. 결과 디코딩 후 반환

**사용 예시:**
\`\`\`json
{
  "methodName": "getValue",
  "params": []
}
\`\`\`

**주의:**
- ABI가 먼저 등록되어 있어야 합니다 (PUT /contracts/:address/abi)
- 메서드 이름은 ABI에 존재하는 함수여야 합니다
- 파라미터는 순서대로 배열로 전달합니다
- 읽기 메서드 (view, pure)만 가능합니다
- 상태 변경 메서드는 POST /contracts/:address/execute를 사용하세요
    `,
  })
  @ApiParam({
    name: 'address',
    description: '컨트랙트 주소',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiResponse({
    status: 200,
    description: '컨트랙트 메서드 호출 성공',
    type: CallContractResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ABI가 없거나 메서드를 찾을 수 없음',
  })
  @ApiResponse({
    status: 404,
    description: '컨트랙트를 찾을 수 없음',
  })
  async callContract(
    @Param('address') address: string,
    @Body() dto: CallContractDto,
  ): Promise<CommonResponseDto<CallContractResponseDto>> {
    const result = await this.contractsService.callContract(address, dto);
    return CommonResponseDto.success(result, '컨트랙트 메서드 호출 성공');
  }
}
