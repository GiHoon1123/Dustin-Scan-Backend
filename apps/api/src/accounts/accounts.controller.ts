import { Controller, Get, Param } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiParam, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { CommonResponseDto } from '../common/dto';
import { AccountsService } from './accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';

@ApiTags('계정 (Accounts)')
@ApiExtraModels(CommonResponseDto, AccountResponseDto)
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
}
