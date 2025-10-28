import { ChainBlockDto } from '@app/common';
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { BlockIndexerService } from './services/block-indexer.service';

/**
 * Indexer Controller
 *
 * Sync Server로부터 블록 데이터를 HTTP로 받아서 처리하는 컨트롤러
 *
 * 역할:
 * 1. Sync Server가 전달한 블록 데이터 수신
 * 2. BlockIndexerService에 전달
 * 3. 처리 결과(성공/실패) 응답
 */
@Controller('indexer')
export class IndexerController {
  private readonly logger = new Logger(IndexerController.name);

  constructor(private readonly blockIndexerService: BlockIndexerService) {}

  /**
   * 블록 인덱싱 요청 수신
   *
   * Sync Server가 POST /indexer/process-block 으로 블록 데이터를 전달하면
   * 이를 받아서 파싱하고 DB에 저장함
   *
   * @param blockData - Chain에서 받은 블록 데이터 (Hex String 포함)
   * @returns 처리 결과 { success: boolean, blockNumber?: number, error?: string }
   */
  @Post('process-block')
  async processBlock(@Body() blockData: ChainBlockDto) {
    const blockNumber = parseInt(blockData.number, 16);

    try {
      this.logger.log(`Received block #${blockNumber} for indexing`);

      // 블록 인덱싱 처리 (트랜잭션 내에서 모두 처리됨)
      await this.blockIndexerService.indexBlock(blockData);

      this.logger.log(`Successfully indexed block #${blockNumber}`);

      return {
        success: true,
        blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to index block #${blockNumber}: ${error.message}`, error.stack);

      // 실패 응답 반환 (Sync Server가 재시도하도록)
      return {
        success: false,
        blockNumber,
        error: error.message,
      };
    }
  }
}
