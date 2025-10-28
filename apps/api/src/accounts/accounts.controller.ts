import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { AccountResponseDto } from './dto/account-response.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: '계정 목록 조회' })
  async getAccounts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<AccountResponseDto[]> {
    return this.accountsService.getAccounts(page, limit);
  }

  @Get(':address')
  @ApiOperation({ summary: '계정 상세 조회' })
  async getAccount(@Param('address') address: string) {
    return this.accountsService.getAccount(address);
  }

  @Get(':address/transactions')
  @ApiOperation({ summary: '계정의 트랜잭션 목록 조회' })
  async getAccountTransactions(
    @Param('address') address: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // TODO: TransactionsService에서 구현
    return [];
  }
}
