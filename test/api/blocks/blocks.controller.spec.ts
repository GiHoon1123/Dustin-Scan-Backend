import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from '../../../apps/api/src/blocks/blocks.controller';
import { BlocksService } from '../../../apps/api/src/blocks/blocks.service';
import { BlockDetailResponseDto } from '../../../apps/api/src/blocks/dto/block-detail-response.dto';
import { BlockResponseDto } from '../../../apps/api/src/blocks/dto/block-response.dto';
import { CommonResponseDto, PaginatedResponseDto } from '../../../apps/api/src/common/dto';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: jest.Mocked<BlocksService>;

  const mockBlock: BlockResponseDto = {
    hash: '0xblockhash',
    number: '100',
    timestamp: '1633024800000',
    parentHash: '0xparent',
    proposer: '0xproposer',
    transactionCount: 5,
    stateRoot: '0xstateroot',
    transactionsRoot: '0xtxroot',
    receiptsRoot: '0xreceiptroot',
    createdAt: '2021-10-01T00:00:00.000Z',
  };

  const mockBlockDetail: BlockDetailResponseDto = {
    ...mockBlock,
    transactions: [],
  };

  beforeEach(async () => {
    const mockService = {
      getBlocks: jest.fn(),
      getBlockByHash: jest.fn(),
      getBlockByNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        {
          provide: BlocksService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get(BlocksService);
  });

  describe('getBlocks', () => {
    it('should return paginated blocks', async () => {
      service.getBlocks.mockResolvedValue({
        blocks: [mockBlock],
        totalCount: 1,
      });

      const result = await controller.getBlocks(1, 20);

      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data.items).toHaveLength(1);
      expect(service.getBlocks).toHaveBeenCalledWith(1, 20);
    });

    it('should limit max page size to 100', async () => {
      service.getBlocks.mockResolvedValue({
        blocks: [],
        totalCount: 0,
      });

      await controller.getBlocks(1, 200);

      expect(service.getBlocks).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('getBlockByNumber', () => {
    it('should return block by number', async () => {
      service.getBlockByNumber.mockResolvedValue(mockBlockDetail);

      const result = await controller.getBlockByNumber(100);

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.number).toBe('100');
      expect(service.getBlockByNumber).toHaveBeenCalledWith(100);
    });
  });

  describe('getBlockByHash', () => {
    it('should return block by hash', async () => {
      service.getBlockByHash.mockResolvedValue(mockBlockDetail);

      const result = await controller.getBlockByHash('0xblockhash');

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.hash).toBe('0xblockhash');
      expect(service.getBlockByHash).toHaveBeenCalledWith('0xblockhash');
    });
  });
});

