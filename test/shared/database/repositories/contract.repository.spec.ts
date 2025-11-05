import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../../../shared/database/entities/contract.entity';
import { ContractRepository } from '../../../../shared/database/repositories/contract.repository';

describe('ContractRepository', () => {
  let repository: ContractRepository;
  let typeOrmRepo: jest.Mocked<Repository<Contract>>;

  const mockContract: Contract = {
    address: '0x123',
    deployer: '0xdeployer',
    transactionHash: '0xtxhash',
    blockNumber: '100',
    blockHash: '0xblockhash',
    bytecode: '0x6080604052',
    abi: null,
    name: null,
    sourceCode: null,
    compilerVersion: null,
    optimization: null,
    timestamp: '1633024800',
    createdAt: new Date('2021-10-01'),
  } as Contract;

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
        ContractRepository,
        {
          provide: getRepositoryToken(Contract),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<ContractRepository>(ContractRepository);
    typeOrmRepo = module.get(getRepositoryToken(Contract));
  });

  describe('findByAddress', () => {
    it('should find contract by address', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockContract);

      const result = await repository.findByAddress('0x123');

      expect(result).toEqual(mockContract);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { address: '0x123' } });
    });
  });

  describe('findByDeployer', () => {
    it('should find contracts by deployer', async () => {
      typeOrmRepo.find.mockResolvedValue([mockContract]);

      const result = await repository.findByDeployer('0xdeployer');

      expect(result).toEqual([mockContract]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { deployer: '0xdeployer' },
        order: { blockNumber: 'DESC' },
      });
    });
  });

  describe('save', () => {
    it('should save contract', async () => {
      typeOrmRepo.save.mockResolvedValue(mockContract);

      const result = await repository.save(mockContract);

      expect(result).toEqual(mockContract);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockContract);
    });
  });

  describe('update', () => {
    it('should update contract', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockContract);
      typeOrmRepo.save.mockResolvedValue({ ...mockContract, abi: [{ type: 'function' }] });

      await repository.update('0x123', { abi: [{ type: 'function' }] });

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({ where: { address: '0x123' } });
      expect(typeOrmRepo.save).toHaveBeenCalled();
    });

    it('should throw error when contract not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.update('0x999', { abi: [] })).rejects.toThrow(
        'Contract not found: 0x999',
      );
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      typeOrmRepo.count.mockResolvedValue(50);

      const result = await repository.count();

      expect(result).toBe(50);
      expect(typeOrmRepo.count).toHaveBeenCalled();
    });
  });

  describe('findPaginated', () => {
    it('should return paginated contracts', async () => {
      typeOrmRepo.findAndCount.mockResolvedValue([[mockContract], 1]);

      const result = await repository.findPaginated(1, 20);

      expect(result).toEqual([[mockContract], 1]);
      expect(typeOrmRepo.findAndCount).toHaveBeenCalledWith({
        order: { blockNumber: 'DESC', createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });
});

