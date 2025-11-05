import { hexToDecimal, hexToDecimalString, weiToDstn } from '@app/common';
import {
  ChainReceiptDto,
  ChainTransactionDto,
} from '@app/common/types/chain-rpc.types';
import { ChainClientService } from '@app/chain-client';
import {
  Transaction,
  TransactionReceipt,
  TransactionReceiptRepository,
  TransactionRepository,
} from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../../../apps/api/src/transactions/transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let txRepo: jest.Mocked<TransactionRepository>;
  let receiptRepo: jest.Mocked<TransactionReceiptRepository>;
  let chainClient: jest.Mocked<ChainClientService>;

  const mockTx: Transaction = {
    hash: '0x123',
    blockHash: '0xabc',
    blockNumber: '100',
    from: '0xfrom',
    to: '0xto',
    value: '1000000000000000000',
    nonce: 1,
    timestamp: '1633024800000',
    createdAt: new Date('2021-10-01'),
  } as Transaction;

  const mockReceipt: TransactionReceipt = {
    transactionHash: '0x123',
    status: 1,
    gasUsed: '21000',
    cumulativeGasUsed: '21000',
    contractAddress: null,
  } as TransactionReceipt;

  const mockChainTx: ChainTransactionDto = {
    hash: '0x456',
    from: '0xfrom2',
    to: '0xto2',
    value: '0x2386f26fc10000',
    nonce: '0x2',
    v: '0x1b',
    r: '0xr',
    s: '0xs',
    blockNumber: '0x64',
    blockHash: '0xdef',
    timestamp: '0x617e0f42',
  };

  const mockChainReceipt: ChainReceiptDto = {
    transactionHash: '0x456',
    transactionIndex: '0x0',
    blockHash: '0xdef',
    blockNumber: '0x64',
    from: '0xfrom2',
    to: '0xto2',
    status: '0x1',
    gasUsed: '0x5208',
    cumulativeGasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: '0x0',
  };

  beforeEach(async () => {
    const mockTxRepo = {
      findPaginated: jest.fn(),
      findByHash: jest.fn(),
      findByAddressPaginated: jest.fn(),
    };

    const mockReceiptRepo = {
      findByTransactionHashes: jest.fn(),
      findByTransactionHash: jest.fn(),
    };

    const mockChainClient = {
      getTransaction: jest.fn(),
      getReceipt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionRepository,
          useValue: mockTxRepo,
        },
        {
          provide: TransactionReceiptRepository,
          useValue: mockReceiptRepo,
        },
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    txRepo = module.get(TransactionRepository);
    receiptRepo = module.get(TransactionReceiptRepository);
    chainClient = module.get(ChainClientService);
  });

  describe('getTransactions', () => {
    it('should return paginated transactions with receipts', async () => {
      const mockTxs = [mockTx];
      const mockReceipts = [mockReceipt];

      txRepo.findPaginated.mockResolvedValue([mockTxs, 1]);
      receiptRepo.findByTransactionHashes.mockResolvedValue(mockReceipts);

      const result = await service.getTransactions(1, 20);

      expect(result.transactions).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.transactions[0].hash).toBe('0x123');
      expect(result.transactions[0].status).toBe(1);
      expect(txRepo.findPaginated).toHaveBeenCalledWith(1, 20);
    });

    it('should return transactions without receipts when receipts are missing', async () => {
      const mockTxs = [mockTx];

      txRepo.findPaginated.mockResolvedValue([mockTxs, 1]);
      receiptRepo.findByTransactionHashes.mockResolvedValue([]);

      const result = await service.getTransactions(1, 20);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].status).toBeUndefined();
    });
  });

  describe('getTransactionByHash', () => {
    it('should return transaction from DB when found', async () => {
      txRepo.findByHash.mockResolvedValue(mockTx);
      receiptRepo.findByTransactionHash.mockResolvedValue(mockReceipt);

      const result = await service.getTransactionByHash('0x123');

      expect(result.hash).toBe('0x123');
      expect(result.status).toBe(1);
      expect(txRepo.findByHash).toHaveBeenCalledWith('0x123');
      expect(chainClient.getTransaction).not.toHaveBeenCalled();
    });

    it('should fetch from chain when not found in DB', async () => {
      txRepo.findByHash.mockResolvedValue(null);
      chainClient.getTransaction.mockResolvedValue(mockChainTx);
      chainClient.getReceipt.mockResolvedValue(mockChainReceipt);

      const result = await service.getTransactionByHash('0x456');

      expect(result.hash).toBe('0x456');
      expect(result.from).toBe('0xfrom2');
      expect(result.status).toBe(1);
      expect(chainClient.getTransaction).toHaveBeenCalledWith('0x456');
      expect(chainClient.getReceipt).toHaveBeenCalledWith('0x456');
    });

    it('should throw NotFoundException when not found in DB and chain returns 404', async () => {
      txRepo.findByHash.mockResolvedValue(null);
      const error = { response: { status: 404 } };
      chainClient.getTransaction.mockRejectedValue(error);

      await expect(service.getTransactionByHash('0x999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when chain client throws error', async () => {
      txRepo.findByHash.mockResolvedValue(null);
      chainClient.getTransaction.mockRejectedValue(new Error('Network error'));

      await expect(service.getTransactionByHash('0x999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle non-404 errors from chain client', async () => {
      txRepo.findByHash.mockResolvedValue(null);
      chainClient.getTransaction.mockRejectedValue({
        response: { status: 500 },
        message: 'Internal server error',
      });

      await expect(service.getTransactionByHash('0xerror')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionsByAddress', () => {
    it('should return transactions for a specific address', async () => {
      const mockTxs = [mockTx];
      const mockReceipts = [mockReceipt];

      txRepo.findByAddressPaginated.mockResolvedValue([mockTxs, 1]);
      receiptRepo.findByTransactionHashes.mockResolvedValue(mockReceipts);

      const result = await service.getTransactionsByAddress('0xfrom', 1, 20);

      expect(result.transactions).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(txRepo.findByAddressPaginated).toHaveBeenCalledWith('0xfrom', 1, 20);
    });
  });

  describe('chainDtoToResponseDto', () => {
    it('should convert chain DTO to response DTO correctly', async () => {
      txRepo.findByHash.mockResolvedValue(null);
      chainClient.getTransaction.mockResolvedValue(mockChainTx);
      chainClient.getReceipt.mockResolvedValue(mockChainReceipt);

      const result = await service.getTransactionByHash('0x456');

      expect(result.hash).toBe('0x456');
      expect(result.blockNumber).toBe('100');
      expect(result.value).toBe(weiToDstn('10000000000000000'));
      expect(result.valueWei).toBe('10000000000000000');
      expect(result.nonce).toBe(2);
      expect(result.status).toBe(1);
      expect(result.gasUsed).toBe('21000');
    });

    it('should handle missing receipt', async () => {
      txRepo.findByHash.mockResolvedValue(null);
      chainClient.getTransaction.mockResolvedValue(mockChainTx);
      chainClient.getReceipt.mockResolvedValue(null);

      const result = await service.getTransactionByHash('0x456');

      expect(result.hash).toBe('0x456');
      expect(result.status).toBeUndefined();
      expect(result.gasUsed).toBeUndefined();
    });
  });
});

