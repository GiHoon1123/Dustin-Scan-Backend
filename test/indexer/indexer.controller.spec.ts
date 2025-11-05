import { Test, TestingModule } from '@nestjs/testing';
import { IndexerController } from '../../apps/indexer/src/indexer.controller';
import { BlockIndexerService } from '../../apps/indexer/src/services/block-indexer.service';
import { ChainBlockDto } from '@app/common/types/chain-rpc.types';

describe('IndexerController', () => {
  let controller: IndexerController;
  let blockIndexerService: jest.Mocked<BlockIndexerService>;

  const mockBlockData: ChainBlockDto = {
    number: '0x64',
    hash: '0xblockhash',
    parentHash: '0xparent',
    timestamp: '0x617e0f42',
    proposer: '0xproposer',
    transactionCount: '0x2',
    transactions: [],
    stateRoot: '0xstateroot',
    transactionsRoot: '0xtxroot',
    receiptsRoot: '0xreceiptroot',
  };

  beforeEach(async () => {
    blockIndexerService = {
      indexBlock: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<BlockIndexerService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexerController],
      providers: [
        {
          provide: BlockIndexerService,
          useValue: blockIndexerService,
        },
      ],
    }).compile();

    controller = module.get<IndexerController>(IndexerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processBlock', () => {
    it('should process block successfully', async () => {
      const result = await controller.processBlock(mockBlockData);

      expect(result.success).toBe(true);
      expect(result.blockNumber).toBe(100);
      expect(blockIndexerService.indexBlock).toHaveBeenCalledWith(mockBlockData);
    });

    it('should handle errors', async () => {
      blockIndexerService.indexBlock.mockRejectedValue(new Error('Indexing failed'));

      const result = await controller.processBlock(mockBlockData);

      expect(result.success).toBe(false);
      expect(result.blockNumber).toBe(100);
      expect(result.error).toBeDefined();
    });
  });
});

