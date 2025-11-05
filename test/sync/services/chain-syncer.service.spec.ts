import { ChainClientService } from '@app/chain-client';
import { ChainBlockDto } from '@app/common/types/chain-rpc.types';
import { Block } from '@app/database';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChainSyncerService } from '../../../apps/sync/src/services/chain-syncer.service';
import axios from 'axios';

jest.mock('axios');

describe('ChainSyncerService', () => {
  let service: ChainSyncerService;
  let blockRepo: jest.Mocked<Repository<Block>>;
  let chainClient: jest.Mocked<ChainClientService>;
  let configService: jest.Mocked<ConfigService>;
  let axiosPost: jest.MockedFunction<typeof axios.post>;

  const mockBlock: Block = {
    number: '100',
    hash: '0xblockhash',
  } as Block;

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
    axiosPost = axios.post as jest.MockedFunction<typeof axios.post>;

    const mockBlockRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    const mockChainClient = {
      getBlockByNumber: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:4001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChainSyncerService,
        {
          provide: getRepositoryToken(Block),
          useValue: mockBlockRepo,
        },
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChainSyncerService>(ChainSyncerService);
    blockRepo = module.get(getRepositoryToken(Block));
    chainClient = module.get(ChainClientService);
    configService = module.get(ConfigService);
  });

  describe('syncNextBlock', () => {
    it('should skip if already processing', async () => {
      (service as any).isProcessing = true;

      await service.syncNextBlock();

      expect(chainClient.getBlockByNumber).not.toHaveBeenCalled();
    });

    it('should skip if block not available', async () => {
      blockRepo.find.mockResolvedValue([mockBlock]);
      chainClient.getBlockByNumber.mockResolvedValue(null);

      await service.syncNextBlock();

      expect(axiosPost).not.toHaveBeenCalled();
    });

    it('should send block to indexer when available', async () => {
      blockRepo.find.mockResolvedValue([mockBlock]);
      chainClient.getBlockByNumber.mockResolvedValue(mockBlockData);
      axiosPost.mockResolvedValue({ status: 200, data: {} });

      await service.syncNextBlock();

      expect(axiosPost).toHaveBeenCalled();
      const callArgs = axiosPost.mock.calls[0];
      expect(callArgs[0]).toBe('http://localhost:4001/indexer/process-block');
      expect(callArgs[1]).toEqual(mockBlockData);
    });

    it('should handle errors gracefully', async () => {
      blockRepo.find.mockResolvedValue([mockBlock]);
      chainClient.getBlockByNumber.mockRejectedValue(new Error('Network error'));

      await expect(service.syncNextBlock()).resolves.not.toThrow();
    });
  });

  describe('getNextBlockNumber', () => {
    it('should return 0 when no blocks exist', async () => {
      blockRepo.find.mockResolvedValue([]);

      const result = await (service as any).getNextBlockNumber();

      expect(result).toBe(0);
    });

    it('should return next block number', async () => {
      blockRepo.find.mockResolvedValue([mockBlock]);

      const result = await (service as any).getNextBlockNumber();

      expect(result).toBe(101);
    });
  });

  describe('fetchBlock', () => {
    it('should return null for 404 error', async () => {
      chainClient.getBlockByNumber.mockRejectedValue({ response: { status: 404 } });

      const result = await (service as any).fetchBlock(999);

      expect(result).toBeNull();
    });

    it('should throw other errors', async () => {
      chainClient.getBlockByNumber.mockRejectedValue(new Error('Network error'));

      await expect((service as any).fetchBlock(100)).rejects.toThrow('Network error');
    });
  });

  describe('getStatus', () => {
    it('should return status with last block', async () => {
      blockRepo.find.mockResolvedValue([
        {
          number: '100',
          hash: '0xhash',
          timestamp: '1633024800000',
        } as Block,
      ]);

      const status = await service.getStatus();

      expect(status.isProcessing).toBeDefined();
      expect(status.lastSyncedBlock).toBeDefined();
      expect(status.lastSyncedBlock?.number).toBe('100');
      expect(status.indexerUrl).toBe('http://localhost:4001');
    });

    it('should return status without last block', async () => {
      blockRepo.find.mockResolvedValue([]);

      const status = await service.getStatus();

      expect(status.lastSyncedBlock).toBeNull();
    });
  });

  describe('sendToIndexer', () => {
    it('should throw error when indexer returns failure', async () => {
      axiosPost.mockResolvedValue({
        status: 200,
        data: { success: false, error: 'Indexing failed' },
      });

      await expect((service as any).sendToIndexer(mockBlockData)).rejects.toThrow();
    });
  });
});

