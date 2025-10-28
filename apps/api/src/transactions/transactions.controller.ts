import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommonResponseDto } from '../common/dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('트랜잭션 (Transactions)')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

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
    type: CommonResponseDto<TransactionResponseDto>,
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
