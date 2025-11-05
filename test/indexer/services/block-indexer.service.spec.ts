import { ChainClientService } from '@app/chain-client';
import {
  ChainBlockDto,
  ChainReceiptDto,
  ChainTransactionDto,
} from '@app/common/types/chain-rpc.types';
import { Block, Contract, Transaction, TransactionReceipt } from '@app/database';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BlockIndexerService } from '../../../apps/indexer/src/services/block-indexer.service';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('BlockIndexerService', () => {
  let service: BlockIndexerService;
  let dataSource: jest.Mocked<DataSource>;
  let chainClient: jest.Mocked<ChainClientService>;

  const mockBlockData: ChainBlockDto = {
    number: '0x64',
    hash: '0xblockhash',
    parentHash: '0xparent',
    timestamp: '0x617e0f42',
    proposer: '0xproposer',
    transactionCount: '0x2',
    transactions: [
      {
        hash: '0xtx1',
        from: '0xfrom1',
        to: '0xto1',
        value: '0x2386f26fc10000',
        nonce: '0x1',
        v: '0x1b',
        r: '0xr',
        s: '0xs',
        timestamp: '0x617e0f42',
      },
    ],
    stateRoot: '0xstateroot',
    transactionsRoot: '0xtxroot',
    receiptsRoot: '0xreceiptroot',
  };

  const mockReceipt: ChainReceiptDto = {
    transactionHash: '0xtx1',
    transactionIndex: '0x0',
    blockHash: '0xblockhash',
    blockNumber: '0x64',
    from: '0xfrom1',
    to: '0xto1',
    status: '0x1',
    gasUsed: '0x5208',
    cumulativeGasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: '0x0',
  };

  beforeEach(async () => {
    const mockTransaction = jest.fn((callback) => callback(mockManager));

    const mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockDataSource = {
      transaction: mockTransaction,
    };

    const mockChainClient = {
      getReceipt: jest.fn(),
      getContractBytecode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockIndexerService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<BlockIndexerService>(BlockIndexerService);
    dataSource = module.get(getDataSourceToken());
    chainClient = module.get(ChainClientService);
  });

  describe('indexBlock', () => {
    it('should skip if block already indexed', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({ hash: '0xblockhash' }),
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));

      await service.indexBlock(mockBlockData);

      expect(mockManager.findOne).toHaveBeenCalledWith(Block, {
        where: { hash: '0xblockhash' },
      });
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should index new block with transactions', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(mockReceipt);

      await service.indexBlock(mockBlockData);

      expect(mockManager.save).toHaveBeenCalledWith(Block, expect.any(Object));
      expect(mockManager.save).toHaveBeenCalledWith(Transaction, expect.any(Object));
      expect(mockManager.save).toHaveBeenCalledWith(TransactionReceipt, expect.any(Object));
      expect(chainClient.getReceipt).toHaveBeenCalled();
    });

    it('should handle missing receipt', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(null);

      await service.indexBlock(mockBlockData);

      expect(mockManager.save).toHaveBeenCalledWith(Block, expect.any(Object));
      expect(mockManager.save).toHaveBeenCalledWith(Transaction, expect.any(Object));
      expect(mockManager.save).not.toHaveBeenCalledWith(TransactionReceipt, expect.any(Object));
    });

    it('should save contract when contractAddress exists', async () => {
      const contractReceipt = { ...mockReceipt, contractAddress: '0xcontract' };
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce(null), // contract check
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(contractReceipt);
      chainClient.getContractBytecode.mockResolvedValue('0x6080604052');

      await service.indexBlock(mockBlockData);

      expect(mockManager.save).toHaveBeenCalledWith(Contract, expect.any(Object));
      expect(chainClient.getContractBytecode).toHaveBeenCalledWith('0xcontract');
    });

    it('should handle contract bytecode fetch failure', async () => {
      const contractReceipt = { ...mockReceipt, contractAddress: '0xcontract' };
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce(null), // contract check
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(contractReceipt);
      chainClient.getContractBytecode.mockRejectedValue(new Error('Failed to fetch'));

      await service.indexBlock(mockBlockData);

      expect(mockManager.save).toHaveBeenCalledWith(Contract, expect.any(Object));
    });

    it('should skip contract save when contractAddress is null', async () => {
      const receiptWithoutContract = { ...mockReceipt, contractAddress: null };
      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(null), // block check
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(receiptWithoutContract);

      await service.indexBlock(mockBlockData);

      // Contract save가 호출되지 않아야 함
      const saveCalls = mockManager.save.mock.calls.filter((call) => call[0] === Contract);
      expect(saveCalls).toHaveLength(0);
    });

    it('should skip contract save when contract already exists', async () => {
      const contractReceipt = { ...mockReceipt, contractAddress: '0xcontract' };
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce({ address: '0xcontract' }), // contract exists
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(contractReceipt);

      await service.indexBlock(mockBlockData);

      // Contract save가 호출되지 않아야 함
      const saveCalls = mockManager.save.mock.calls.filter((call) => call[0] === Contract);
      expect(saveCalls).toHaveLength(0);
    });
  });
});

