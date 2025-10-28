import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
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
import { BlocksService } from './blocks.service';
import { BlockDetailResponseDto } from './dto/block-detail-response.dto';
import { BlockResponseDto } from './dto/block-response.dto';

@ApiTags('블록 (Blocks)')
@ApiExtraModels(CommonResponseDto, PaginatedResponseDto, BlockResponseDto, BlockDetailResponseDto)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @ApiOperation({
    summary: '블록 목록 조회',
    description: `
최신 블록부터 역순으로 조회합니다.

**특징:**
- 기본 20개씩 페이징 처리
- 최신 블록부터 표시 (blockNumber DESC)
- 페이징 정보 포함

**사용 예시:**
- \`GET /blocks\` - 최신 블록 20개
- \`GET /blocks?page=2\` - 2페이지 (21~40번째 블록)
- \`GET /blocks?page=1&limit=50\` - 최신 블록 50개
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 개수 (최대 100)',
    example: 20,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '블록 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(BlockResponseDto) },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getBlocks(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ): Promise<PaginatedResponseDto<BlockResponseDto>> {
    // limit는 최대 100으로 제한
    const actualLimit = Math.min(limit, 100);

    const { blocks, totalCount } = await this.blocksService.getBlocks(page, actualLimit);

    return new PaginatedResponseDto(blocks, page, actualLimit, totalCount, '블록 목록 조회 성공');
  }

  @Get('number/:number')
  @ApiOperation({
    summary: '블록 번호로 조회',
    description: `
특정 블록 번호로 블록 상세 정보를 조회합니다.

**특징:**
- Genesis 블록은 #0
- 블록 번호는 0부터 시작
- 존재하지 않는 블록 번호 요청 시 404 에러

**사용 예시:**
- \`GET /blocks/number/0\` - Genesis 블록 조회
- \`GET /blocks/number/100\` - 100번 블록 조회
    `,
  })
  @ApiParam({
    name: 'number',
    description: '블록 번호 (0부터 시작)',
    example: 0,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '블록 조회 성공 (트랜잭션 목록 포함)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(BlockDetailResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '블록을 찾을 수 없음',
  })
  async getBlockByNumber(
    @Param('number', ParseIntPipe) number: number,
  ): Promise<CommonResponseDto<BlockDetailResponseDto>> {
    const block = await this.blocksService.getBlockByNumber(number);
    return CommonResponseDto.success(block, `블록 #${number} 조회 성공`);
  }

  @Get('hash/:hash')
  @ApiOperation({
    summary: '블록 해시로 조회',
    description: `
블록 해시(Block Hash)로 블록 상세 정보를 조회합니다.

**특징:**
- 해시는 0x로 시작하는 64자리 16진수
- 블록 해시는 블록의 고유 식별자
- 존재하지 않는 해시 요청 시 404 에러

**사용 예시:**
- \`GET /blocks/hash/0xabc123...\` - 특정 해시의 블록 조회
    `,
  })
  @ApiParam({
    name: 'hash',
    description: '블록 해시 (0x로 시작)',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '블록 조회 성공 (트랜잭션 목록 포함)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(BlockDetailResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '블록을 찾을 수 없음',
  })
  async getBlockByHash(
    @Param('hash') hash: string,
  ): Promise<CommonResponseDto<BlockDetailResponseDto>> {
    const block = await this.blocksService.getBlockByHash(hash);
    return CommonResponseDto.success(block, '블록 조회 성공');
  }
}
