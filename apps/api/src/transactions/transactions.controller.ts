import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CommonResponseDto, PaginatedResponseDto } from '../common/dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('트랜잭션 (Transactions)')
@ApiExtraModels(CommonResponseDto, TransactionResponseDto, PaginatedResponseDto)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get('address/:address')
  @ApiOperation({
    summary: '특정 지갑 주소의 트랜잭션 목록 조회',
    description: `
특정 지갑 주소와 관련된 모든 트랜잭션을 조회합니다.
- from 또는 to가 해당 주소인 트랜잭션 포함
- 최신 트랜잭션부터 정렬
- 페이징 지원 (최대 100개)
    `,
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
    description: '트랜잭션 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(TransactionResponseDto) },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getTransactionsByAddress(
    @Param('address') address: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const actualLimit = Math.min(limit, 100);
    const { transactions, totalCount } = await this.txService.getTransactionsByAddress(
      address,
      page,
      actualLimit,
    );
    return new PaginatedResponseDto(
      transactions,
      page,
      actualLimit,
      totalCount,
      `지갑 ${address.substring(0, 10)}...의 트랜잭션 목록 조회 성공`,
    );
  }

  @Get(':hash')
  @ApiOperation({
    summary: '트랜잭션 조회',
    description: `
트랜잭션 해시로 트랜잭션 상세 정보를 조회합니다.

**응답 포함 정보:**
1. **기본 트랜잭션 정보**
   - 트랜잭션 해시 (hash)
   - 송신자/수신자 주소 (from, to)
   - 전송 금액 (value: DSTN 단위, valueWei: Wei 단위)
   - Nonce, 타임스탬프

2. **트랜잭션 Receipt 정보**
   - \`status\`: 트랜잭션 실행 상태
     - \`1\`: 성공 (Success)
     - \`0\`: 실패 (Failed)
   - \`gasUsed\`: 실제 사용된 Gas (Wei)
   - \`cumulativeGasUsed\`: 블록 내 누적 Gas 사용량
   - \`contractAddress\`: 컨트랙트 배포 시 생성된 주소 (일반 송금은 null)

**특징:**
- Receipt 정보는 트랜잭션이 블록에 포함된 후에만 존재
- Pending 상태 트랜잭션은 Receipt 없음
- 존재하지 않는 해시 요청 시 404 에러

**사용 예시:**
- \`GET /transactions/0xabc123...\` - 트랜잭션 상세 조회
    `,
  })
  @ApiParam({
    name: 'hash',
    description: '트랜잭션 해시 (0x로 시작하는 64자리 16진수)',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '트랜잭션 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '트랜잭션을 찾을 수 없음',
  })
  async getTransaction(
    @Param('hash') hash: string,
  ): Promise<CommonResponseDto<TransactionResponseDto>> {
    const transaction = await this.txService.getTransactionByHash(hash);
    return CommonResponseDto.success(transaction, '트랜잭션 조회 성공');
  }
}
