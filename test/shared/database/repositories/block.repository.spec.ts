import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../../../../shared/database/entities/block.entity';
import { BlockRepository } from '../../../../shared/database/repositories/block.repository';

describe('BlockRepository', () => {
  let repository: BlockRepository;
  let typeOrmRepo: jest.Mocked<Repository<Block>>;

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
    createdAt: new Date('2021-10-01'),
  } as Block;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockRepository,
        {
          provide: getRepositoryToken(Block),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<BlockRepository>(BlockRepository);
    typeOrmRepo = module.get(getRepositoryToken(Block));
  });

  describe('findByHash', () => {
    it('should find block by hash', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockBlock);

      const result = await repository.findByHash('0xblockhash');

      expect(result).toEqual(mockBlock);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { hash: '0xblockhash' } });
    });
  });

  describe('findByNumber', () => {
    it('should find block by number', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockBlock);

      const result = await repository.findByNumber('100');

      expect(result).toEqual(mockBlock);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { number: '100' } });
    });
  });

  describe('findLatest', () => {
    it('should find latest blocks', async () => {
      typeOrmRepo.find.mockResolvedValue([mockBlock]);

      const result = await repository.findLatest(10);

      expect(result).toEqual([mockBlock]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        order: { number: 'DESC' },
        take: 10,
      });
    });
  });

  describe('findPaginated', () => {
    it('should return paginated blocks', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[mockBlock], 1]);

      const result = await repository.findPaginated(1, 20);

      expect(result).toEqual([[mockBlock], 1]);
      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith({
        order: { number: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findLastSaved', () => {
    it('should find last saved block', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockBlock);

      const result = await repository.findLastSaved();

      expect(result).toEqual(mockBlock);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        order: { number: 'DESC' },
      });
    });
  });

  describe('save', () => {
    it('should save block', async () => {
      typeOrmRepo.save.mockResolvedValue(mockBlock);

      const result = await repository.save(mockBlock);

      expect(result).toEqual(mockBlock);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockBlock);
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

