import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractMethod } from '../../../../shared/database/entities/contract-method.entity';
import { ContractMethodRepository } from '../../../../shared/database/repositories/contract-method.repository';

describe('ContractMethodRepository', () => {
  let repository: ContractMethodRepository;
  let typeOrmRepo: jest.Mocked<Repository<ContractMethod>>;

  const mockMethod: ContractMethod = {
    contractAddress: '0x123',
    methodName: 'setValue',
    methodSignature: '0xa6f9dae1',
    inputs: [{ name: 'value', type: 'uint256', internalType: 'uint256' }],
    type: 'function',
    stateMutability: 'nonpayable',
  } as ContractMethod;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractMethodRepository,
        {
          provide: getRepositoryToken(ContractMethod),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<ContractMethodRepository>(ContractMethodRepository);
    typeOrmRepo = module.get(getRepositoryToken(ContractMethod));
  });

  describe('findByContractAddress', () => {
    it('should find methods by contract address', async () => {
      typeOrmRepo.find.mockResolvedValue([mockMethod]);

      const result = await repository.findByContractAddress('0x123');

      expect(result).toEqual([mockMethod]);
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { contractAddress: '0x123' },
        order: { methodName: 'ASC' },
      });
    });
  });

  describe('findByContractAndMethod', () => {
    it('should find method by contract and method name', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockMethod);

      const result = await repository.findByContractAndMethod('0x123', 'setValue');

      expect(result).toEqual(mockMethod);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { contractAddress: '0x123', methodName: 'setValue' },
      });
    });
  });

  describe('saveMany', () => {
    it('should save many methods', async () => {
      typeOrmRepo.save.mockResolvedValue([mockMethod] as any);

      const result = await repository.saveMany([mockMethod]);

      expect(result).toEqual([mockMethod]);
      expect(typeOrmRepo.save).toHaveBeenCalledWith([mockMethod]);
    });
  });

  describe('deleteByContractAddress', () => {
    it('should delete methods by contract address', async () => {
      typeOrmRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.deleteByContractAddress('0x123');

      expect(typeOrmRepo.delete).toHaveBeenCalledWith({ contractAddress: '0x123' });
    });
  });

  describe('save', () => {
    it('should save method', async () => {
      typeOrmRepo.save.mockResolvedValue(mockMethod);

      const result = await repository.save(mockMethod);

      expect(result).toEqual(mockMethod);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockMethod);
    });
  });
});

