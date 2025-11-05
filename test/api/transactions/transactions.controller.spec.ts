import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from '../../../apps/api/src/transactions/transactions.controller';
import { TransactionsService } from '../../../apps/api/src/transactions/transactions.service';
import { TransactionResponseDto } from '../../../apps/api/src/transactions/dto/transaction-response.dto';
import { CommonResponseDto, PaginatedResponseDto } from '../../../apps/api/src/common/dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: jest.Mocked<TransactionsService>;

  const mockTx: TransactionResponseDto = {
    hash: '0x123',
    blockHash: '0xabc',
    blockNumber: '100',
    from: '0xfrom',
    to: '0xto',
    value: '1.0',
    valueWei: '1000000000000000000',
    nonce: 1,
    timestamp: '1633024800000',
    createdAt: '2021-10-01T00:00:00.000Z',
    status: 1,
    gasUsed: '21000',
    cumulativeGasUsed: '21000',
    contractAddress: null,
  };

  beforeEach(async () => {
    const mockService = {
      getTransactions: jest.fn(),
      getTransactionByHash: jest.fn(),
      getTransactionsByAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get(TransactionsService);
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      service.getTransactions.mockResolvedValue({
        transactions: [mockTx],
        totalCount: 1,
      });

      const result = await controller.getTransactions(1, 20);

      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.pagination.totalCount).toBe(1);
      expect(service.getTransactions).toHaveBeenCalledWith(1, 20);
    });

    it('should limit max page size to 100', async () => {
      service.getTransactions.mockResolvedValue({
        transactions: [],
        totalCount: 0,
      });

      await controller.getTransactions(1, 200);

      expect(service.getTransactions).toHaveBeenCalledWith(1, 100);
    });

    it('should use default values when params are not provided', async () => {
      service.getTransactions.mockResolvedValue({
        transactions: [],
        totalCount: 0,
      });

      await controller.getTransactions(undefined, undefined);

      expect(service.getTransactions).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction by hash', async () => {
      service.getTransactionByHash.mockResolvedValue(mockTx);

      const result = await controller.getTransaction('0x123');

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.hash).toBe('0x123');
      expect(result.success).toBe(true);
      expect(service.getTransactionByHash).toHaveBeenCalledWith('0x123');
    });
  });

  describe('getTransactionsByAddress', () => {
    it('should return transactions for address', async () => {
      service.getTransactionsByAddress.mockResolvedValue({
        transactions: [mockTx],
        totalCount: 1,
      });

      const result = await controller.getTransactionsByAddress('0xfrom', 1, 20);

      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data.items).toHaveLength(1);
      expect(service.getTransactionsByAddress).toHaveBeenCalledWith('0xfrom', 1, 20);
    });

    it('should limit max page size to 100', async () => {
      service.getTransactionsByAddress.mockResolvedValue({
        transactions: [],
        totalCount: 0,
      });

      await controller.getTransactionsByAddress('0xfrom', 1, 200);

      expect(service.getTransactionsByAddress).toHaveBeenCalledWith('0xfrom', 1, 100);
    });
  });
});

