import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionReceipt } from '../../../../shared/database/entities/transaction-receipt.entity';
import { TransactionReceiptRepository } from '../../../../shared/database/repositories/transaction-receipt.repository';

describe('TransactionReceiptRepository', () => {
  let repository: TransactionReceiptRepository;
  let typeOrmRepo: jest.Mocked<Repository<TransactionReceipt>>;

  const mockReceipt: TransactionReceipt = {
    transactionHash: '0xtxhash',
    transactionIndex: 0,
    blockHash: '0xblockhash',
    blockNumber: '100',
    from: '0xfrom',
    to: '0xto',
    status: 1,
    gasUsed: '21000',
    cumulativeGasUsed: '21000',
    contractAddress: null,
  } as TransactionReceipt;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionReceiptRepository,
        {
          provide: getRepositoryToken(TransactionReceipt),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TransactionReceiptRepository>(TransactionReceiptRepository);
    typeOrmRepo = module.get(getRepositoryToken(TransactionReceipt));
  });

  describe('findByTransactionHash', () => {
    it('should find receipt by transaction hash', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockReceipt);

      const result = await repository.findByTransactionHash('0xtxhash');

      expect(result).toEqual(mockReceipt);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { transactionHash: '0xtxhash' } });
    });
  });

  describe('findByTransactionHashes', () => {
    it('should find receipts by transaction hashes', async () => {
      typeOrmRepo.find.mockResolvedValue([mockReceipt]);

      const result = await repository.findByTransactionHashes(['0xtxhash']);

      expect(result).toEqual([mockReceipt]);
      expect(typeOrmRepo.find).toHaveBeenCalled();
    });

    it('should return empty array when hashes array is empty', async () => {
      const result = await repository.findByTransactionHashes([]);

      expect(result).toEqual([]);
      expect(typeOrmRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('findByBlockHash', () => {
    it('should find receipts by block hash', async () => {
      typeOrmRepo.find.mockResolvedValue([mockReceipt]);

      const result = await repository.findByBlockHash('0xblockhash');

      expect(result).toEqual([mockReceipt]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { blockHash: '0xblockhash' },
        order: { transactionIndex: 'ASC' },
      });
    });
  });

  describe('findByBlockNumber', () => {
    it('should find receipts by block number', async () => {
      typeOrmRepo.find.mockResolvedValue([mockReceipt]);

      const result = await repository.findByBlockNumber('100');

      expect(result).toEqual([mockReceipt]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { blockNumber: '100' },
        order: { transactionIndex: 'ASC' },
      });
    });
  });

  describe('save', () => {
    it('should save receipt', async () => {
      typeOrmRepo.save.mockResolvedValue(mockReceipt);

      const result = await repository.save(mockReceipt);

      expect(result).toEqual(mockReceipt);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockReceipt);
    });
  });

  describe('saveMany', () => {
    it('should save many receipts', async () => {
      typeOrmRepo.save.mockResolvedValue([mockReceipt] as any);

      const result = await repository.saveMany([mockReceipt]);

      expect(result).toEqual([mockReceipt]);
      expect(typeOrmRepo.save).toHaveBeenCalledWith([mockReceipt]);
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      typeOrmRepo.count.mockResolvedValue(100);

      const result = await repository.count();

      expect(result).toBe(100);
      expect(typeOrmRepo.count).toHaveBeenCalled();
    });
  });
});

