import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { BlockResponseDto } from './dto/block-response.dto';

@ApiTags('blocks')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @ApiOperation({ summary: '블록 목록 조회' })
  async getBlocks(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<BlockResponseDto[]> {
    return this.blocksService.getBlocks(page, limit);
  }

  @Get(':hashOrNumber')
  @ApiOperation({ summary: '블록 상세 조회' })
  async getBlock(@Param('hashOrNumber') hashOrNumber: string) {
    // 0x로 시작하면 hash, 아니면 number
    if (hashOrNumber.startsWith('0x')) {
      return this.blocksService.getBlockByHash(hashOrNumber);
    }
    return this.blocksService.getBlockByNumber(Number(hashOrNumber));
  }
}
