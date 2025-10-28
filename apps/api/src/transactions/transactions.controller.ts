import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: '트랜잭션 목록 조회' })
  async getTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<TransactionResponseDto[]> {
    return this.txService.getTransactions(page, limit);
  }

  @Get(':hash')
  @ApiOperation({ summary: '트랜잭션 상세 조회' })
  async getTransaction(@Param('hash') hash: string) {
    return this.txService.getTransactionByHash(hash);
  }
}
