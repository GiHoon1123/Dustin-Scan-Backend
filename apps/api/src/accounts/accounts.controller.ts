import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CommonResponseDto } from '../common/dto';
import { AccountsService } from './accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { TokenBalanceDto } from './dto/token-balance.dto';
import { TokenTransferItemDto } from './dto/token-transfer-item.dto';
import {
  TransactionResultResponseDto,
  TransferNativeRequestDto,
} from './dto/transfer-native.dto';

@ApiTags('계정 (Accounts)')
@ApiExtraModels(
  CommonResponseDto,
  AccountResponseDto,
  TokenBalanceDto,
  TokenTransferItemDto,
  TransferNativeRequestDto,
  TransactionResultResponseDto,
)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':address')
  @ApiOperation({
    summary: '계정 조회',
    description: `
지갑 주소로 계정 정보를 실시간 조회합니다.

**응답 포함 정보:**
1. **실시간 RPC 조회 데이터**
   - \`balance\`: 현재 잔액 (DSTN 단위, 사용자 친화적)
   - \`balanceWei\`: 현재 잔액 (Wei 단위, 원본 데이터)
   - \`nonce\`: 계정이 전송한 트랜잭션 개수

2. **DB 조회 데이터**
   - \`txCount\`: 해당 주소와 관련된 총 트랜잭션 개수 (송신 + 수신)

**특징:**
- 💡 **실시간 조회**: 계정 잔액과 nonce는 DB에 저장하지 않고 체인 RPC에서 실시간 조회
- 💰 **단위 변환**: DSTN과 Wei 두 가지 단위로 제공
  - 1 DSTN = 10^18 Wei (이더리움 표준)
- 🔍 **EOA 계정**: 현재는 일반 지갑 계정(EOA)만 지원
- 📊 **트랜잭션 개수**: from 또는 to로 포함된 모든 트랜잭션 카운트

**사용 예시:**
- \`GET /accounts/0x123abc...\` - 특정 지갑 주소 조회
- Genesis 계정 조회 가능 (초기 잔액 1000 DSTN)

**주의사항:**
- 존재하지 않는 주소 요청 시 404 에러
- 주소는 0x로 시작하는 40자리 16진수
    `,
  })
  @ApiParam({
    name: 'address',
    description: '지갑 주소 (0x로 시작하는 40자리 16진수)',
    example: '0x2ac26b318b1136e535abb97733a00cc8b80a5b49',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '계정 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(AccountResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '계정을 찾을 수 없음',
  })
  async getAccount(
    @Param('address') address: string,
  ): Promise<CommonResponseDto<AccountResponseDto>> {
    const account = await this.accountsService.getAccount(address);
    return CommonResponseDto.success(account, '계정 조회 성공');
  }

  @Get(':address/tokens')
  @ApiOperation({
    summary: '지갑 토큰 자산 목록 조회',
    description:
      '특정 지갑 주소가 보유한 토큰들의 목록과 각 토큰별 잔액을 조회합니다. 잔액은 token_transfers 집계를 기반으로 계산됩니다.',
  })
  @ApiParam({
    name: 'address',
    description: '지갑 주소 (0x로 시작하는 40자리 16진수)',
    example: '0x2ac26b318b1136e535abb97733a00cc8b80a5b49',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 개수 (기본값: 20, 최대: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '토큰 자산 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: {
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(TokenBalanceDto) },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getTokenBalances(
    @Param('address') address: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<CommonResponseDto<{ items: TokenBalanceDto[] }>> {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 20;
    const currentPage = parsedPage < 1 ? 1 : parsedPage;
    const actualLimit = Math.min(parsedLimit < 1 ? 20 : parsedLimit, 100);

    const result = await this.accountsService.getTokenBalances(
      address,
      currentPage,
      actualLimit,
    );

    return CommonResponseDto.success(result, '토큰 자산 목록 조회 성공');
  }

  @Get(':address/token-transfers')
  @ApiOperation({
    summary: '지갑 토큰 전송 내역 조회',
    description:
      '특정 지갑 주소 기준으로 토큰 전송 내역을 조회합니다. token 파라미터를 사용하면 특정 토큰에 대한 내역만 필터링할 수 있습니다.',
  })
  @ApiParam({
    name: 'address',
    description: '지갑 주소 (0x로 시작하는 40자리 16진수)',
    example: '0x2ac26b318b1136e535abb97733a00cc8b80a5b49',
    type: String,
  })
  @ApiQuery({
    name: 'token',
    required: false,
    description: '특정 토큰 컨트랙트 주소로 필터링 (선택)',
    example: '0xTokenAddress...',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 개수 (기본값: 20, 최대: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '토큰 전송 내역 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: {
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(TokenTransferItemDto) },
                },
                totalCount: {
                  type: 'number',
                  example: 42,
                },
              },
            },
          },
        },
      ],
    },
  })
  async getTokenTransfers(
    @Param('address') address: string,
    @Query('token') token?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<CommonResponseDto<{ items: TokenTransferItemDto[]; totalCount: number }>> {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 20;
    const currentPage = parsedPage < 1 ? 1 : parsedPage;
    const actualLimit = Math.min(parsedLimit < 1 ? 20 : parsedLimit, 100);

    const result = await this.accountsService.getTokenTransfers(
      address,
      token,
      currentPage,
      actualLimit,
    );

    return CommonResponseDto.success(result, '토큰 전송 내역 조회 성공');
  }

  @Post('create-wallet')
  @ApiOperation({
    summary: '새 지갑 생성',
    description:
      '새로운 지갑을 생성합니다. 개인키, 공개키, 주소를 반환합니다. (주의: 실제 프로덕션에서는 클라이언트에서 생성해야 합니다)',
  })
  @ApiResponse({
    status: 201,
    description: '지갑이 성공적으로 생성됨',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                privateKey: { type: 'string', example: '0x...' },
                publicKey: { type: 'string', example: '0x...' },
                address: { type: 'string', example: '0x...' },
                balance: { type: 'string', example: '0' },
                nonce: { type: 'number', example: 0 },
              },
            },
          },
        },
      ],
    },
  })
  async createWallet(): Promise<CommonResponseDto<{
    privateKey: string;
    publicKey: string;
    address: string;
    balance: string;
    nonce: number;
  }>> {
    const wallet = await this.accountsService.createWallet();
    return CommonResponseDto.success(wallet, '지갑 생성 성공');
  }

  @Post('transfer-native')
  @ApiOperation({
    summary: '네이티브 토큰(DSTN) 전송',
    description: '네이티브 토큰(DSTN)을 다른 주소로 전송합니다. 트랜잭션이 블록에 반영될 때까지 대기합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '네이티브 토큰 전송 성공 (트랜잭션 반영 확인 완료)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResultResponseDto) },
          },
        },
      ],
    },
  })
  async transferNative(
    @Body() body: TransferNativeRequestDto,
  ): Promise<CommonResponseDto<TransactionResultResponseDto>> {
    const result = await this.accountsService.transferNative(
      body.privateKey,
      body.to,
      body.amount,
    );
    return CommonResponseDto.success(result, '네이티브 토큰 전송 성공');
  }
}
