import {
  Block,
  BlockRepository,
  Transaction,
  TransactionReceipt,
  TransactionReceiptRepository,
  TransactionRepository,
} from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlocksService } from '../../../apps/api/src/blocks/blocks.service';

describe('BlocksService', () => {
  let service: BlocksService;
  let blockRepo: jest.Mocked<BlockRepository>;
  let txRepo: jest.Mocked<TransactionRepository>;
  let receiptRepo: jest.Mocked<TransactionReceiptRepository>;

  const mockBlock: Block = {
    hash: '0xblockhash',
    number: '100',
    timestamp: '1633024800000',
    parentHash: '0xparent',
    proposer: '0xproposer',
    transactionCount: 5,
    stateRoot: '0xstateroot',
    transactionsRoot: '0xtxroot',
    receiptsRoot: '0xreceiptroot',
    raw: null,
    createdAt: new Date('2021-10-01'),
  } as Block;

  const mockTx: Transaction = {
    hash: '0xtxhash',
    blockHash: '0xblockhash',
    blockNumber: '100',
    from: '0xfrom',
    to: '0xto',
    value: '1000000000000000000',
    nonce: 1,
    timestamp: '1633024800000',
    createdAt: new Date('2021-10-01'),
  } as Transaction;

  const mockReceipt: TransactionReceipt = {
    transactionHash: '0xtxhash',
    status: 1,
    gasUsed: '21000',
    cumulativeGasUsed: '21000',
    contractAddress: null,
  } as TransactionReceipt;

  beforeEach(async () => {
    const mockBlockRepo = {
      findPaginated: jest.fn(),
      findByHash: jest.fn(),
      findByNumber: jest.fn(),
    };

    const mockTxRepo = {
      findByBlockHash: jest.fn(),
    };

    const mockReceiptRepo = {
      findByTransactionHashes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: BlockRepository,
          useValue: mockBlockRepo,
        },
        {
          provide: TransactionRepository,
          useValue: mockTxRepo,
        },
        {
          provide: TransactionReceiptRepository,
          useValue: mockReceiptRepo,
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    blockRepo = module.get(BlockRepository);
    txRepo = module.get(TransactionRepository);
    receiptRepo = module.get(TransactionReceiptRepository);
  });

  describe('getBlocks', () => {
    it('should return paginated blocks', async () => {
      blockRepo.findPaginated.mockResolvedValue([[mockBlock], 1]);

      const result = await service.getBlocks(1, 20);

      expect(result.blocks).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.blocks[0].hash).toBe('0xblockhash');
    });
  });

  describe('getBlockByHash', () => {
    it('should return block with transactions', async () => {
      blockRepo.findByHash.mockResolvedValue(mockBlock);
      txRepo.findByBlockHash.mockResolvedValue([mockTx]);
      receiptRepo.findByTransactionHashes.mockResolvedValue([mockReceipt]);

      const result = await service.getBlockByHash('0xblockhash');

      expect(result.hash).toBe('0xblockhash');
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe('0xtxhash');
    });

    it('should throw NotFoundException when block not found', async () => {
      blockRepo.findByHash.mockResolvedValue(null);

      await expect(service.getBlockByHash('0x999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBlockByNumber', () => {
    it('should return block by number', async () => {
      blockRepo.findByNumber.mockResolvedValue(mockBlock);
      txRepo.findByBlockHash.mockResolvedValue([mockTx]);
      receiptRepo.findByTransactionHashes.mockResolvedValue([mockReceipt]);

      const result = await service.getBlockByNumber(100);

      expect(result.number).toBe('100');
      expect(blockRepo.findByNumber).toHaveBeenCalledWith('100');
    });

    it('should throw NotFoundException when block not found', async () => {
      blockRepo.findByNumber.mockResolvedValue(null);

      await expect(service.getBlockByNumber(999)).rejects.toThrow(NotFoundException);
    });

    it('should handle block with no transactions', async () => {
      blockRepo.findByHash.mockResolvedValue(mockBlock);
      txRepo.findByBlockHash.mockResolvedValue([]);
      receiptRepo.findByTransactionHashes.mockResolvedValue([]);

      const result = await service.getBlockByHash('0xblockhash');

      expect(result.transactions).toHaveLength(0);
    });

    it('should handle transactions without receipts', async () => {
      blockRepo.findByHash.mockResolvedValue(mockBlock);
      txRepo.findByBlockHash.mockResolvedValue([mockTx]);
      receiptRepo.findByTransactionHashes.mockResolvedValue([]);

      const result = await service.getBlockByHash('0xblockhash');

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].status).toBeUndefined();
      expect(result.transactions[0].gasUsed).toBeUndefined();
    });
  });
});

