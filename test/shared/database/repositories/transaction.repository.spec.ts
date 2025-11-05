import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../../../shared/database/entities/transaction.entity';
import { TransactionRepository } from '../../../../shared/database/repositories/transaction.repository';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let typeOrmRepo: jest.Mocked<Repository<Transaction>>;

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

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);
    typeOrmRepo = module.get(getRepositoryToken(Transaction));
  });

  describe('findByHash', () => {
    it('should find transaction by hash', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockTx);

      const result = await repository.findByHash('0x123');

      expect(result).toEqual(mockTx);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { hash: '0x123' } });
    });
  });

  describe('findByBlockHash', () => {
    it('should find transactions by block hash', async () => {
      typeOrmRepo.find.mockResolvedValue([mockTx]);

      const result = await repository.findByBlockHash('0xabc');

      expect(result).toEqual([mockTx]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { blockHash: '0xabc' },
        order: { nonce: 'ASC' },
      });
    });
  });

  describe('findByBlockNumber', () => {
    it('should find transactions by block number', async () => {
      typeOrmRepo.find.mockResolvedValue([mockTx]);

      const result = await repository.findByBlockNumber('100');

      expect(result).toEqual([mockTx]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { blockNumber: '100' },
        order: { nonce: 'ASC' },
      });
    });
  });

  describe('findPaginated', () => {
    it('should return paginated transactions', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[mockTx], 1]);

      const result = await repository.findPaginated(1, 20);

      expect(result).toEqual([[mockTx], 1]);
      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith({
        order: { blockNumber: 'DESC', hash: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findByAddressPaginated', () => {
    it('should return paginated transactions for address', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTx]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      typeOrmRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findByAddressPaginated('0xfrom', 1, 20);

      expect(result).toEqual([[mockTx], 1]);
      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('tx');
    });
  });

  describe('countByAddress', () => {
    it('should count transactions for address', async () => {
      typeOrmRepo.count.mockResolvedValue(10);

      const result = await repository.countByAddress('0xfrom');

      expect(result).toBe(10);
      expect(typeOrmRepo.count).toHaveBeenCalledWith({
        where: [{ from: '0xfrom' }, { to: '0xfrom' }],
      });
    });
  });

  describe('save', () => {
    it('should save transaction', async () => {
      typeOrmRepo.save.mockResolvedValue(mockTx);

      const result = await repository.save(mockTx);

      expect(result).toEqual(mockTx);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockTx);
    });
  });

  describe('saveMany', () => {
    it('should save many transactions', async () => {
      typeOrmRepo.save.mockResolvedValue([mockTx] as any);

      const result = await repository.saveMany([mockTx]);

      expect(result).toEqual([mockTx]);
      expect(typeOrmRepo.save).toHaveBeenCalledWith([mockTx]);
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

