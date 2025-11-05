import { ChainClientService } from '@app/chain-client';
import {
  Contract,
  ContractMethod,
  ContractMethodRepository,
  ContractRepository,
} from '@app/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Interface } from 'ethers';
import { ContractsService } from '../../../apps/api/src/contracts/contracts.service';
import { CallContractDto } from '../../../apps/api/src/contracts/dto/call-contract.dto';
import { ExecuteContractDto } from '../../../apps/api/src/contracts/dto/execute-contract.dto';
import { UpdateContractAbiDto } from '../../../apps/api/src/contracts/dto/update-contract-abi.dto';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractRepo: jest.Mocked<ContractRepository>;
  let methodRepo: jest.Mocked<ContractMethodRepository>;
  let chainClient: jest.Mocked<ChainClientService>;

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

  const mockAbi = [
    {
      inputs: [],
      name: 'getValue',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'value', type: 'uint256' }],
      name: 'setValue',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  beforeEach(async () => {
    const mockContractRepo = {
      findPaginated: jest.fn(),
      findByAddress: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    const mockMethodRepo = {
      findByContractAndMethod: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      deleteByContractAddress: jest.fn(),
    };

    const mockChainClient = {
      deployContract: jest.fn(),
      executeContract: jest.fn(),
      callContract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: ContractRepository,
          useValue: mockContractRepo,
        },
        {
          provide: ContractMethodRepository,
          useValue: mockMethodRepo,
        },
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    contractRepo = module.get(ContractRepository);
    methodRepo = module.get(ContractMethodRepository);
    chainClient = module.get(ChainClientService);
  });

  describe('getContracts', () => {
    it('should return paginated contracts', async () => {
      contractRepo.findPaginated.mockResolvedValue([[mockContract], 1]);

      const result = await service.getContracts(1, 20);

      expect(result.contracts).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.contracts[0].address).toBe('0x123');
    });
  });

  describe('getContract', () => {
    it('should return contract by address', async () => {
      contractRepo.findByAddress.mockResolvedValue(mockContract);

      const result = await service.getContract('0x123');

      expect(result.address).toBe('0x123');
      expect(contractRepo.findByAddress).toHaveBeenCalledWith('0x123');
    });

    it('should throw NotFoundException when contract not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(null);

      await expect(service.getContract('0x999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deployContract', () => {
    it('should deploy contract and return transaction hash', async () => {
      chainClient.deployContract.mockResolvedValue({
        hash: '0xdeployhash',
        status: 'pending',
      });

      const result = await service.deployContract({ bytecode: '0x6080604052' });

      expect(result.transactionHash).toBe('0xdeployhash');
      expect(result.status).toBe('pending');
      expect(chainClient.deployContract).toHaveBeenCalledWith('0x6080604052');
    });
  });

  describe('updateContractAbi', () => {
    it('should update contract ABI', async () => {
      const updatedContract = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValueOnce(mockContract).mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);
      methodRepo.deleteByContractAddress.mockResolvedValue(undefined);
      methodRepo.saveMany.mockResolvedValue([]);

      const dto: UpdateContractAbiDto = { abi: mockAbi };
      const result = await service.updateContractAbi('0x123', dto);

      expect(result.abi).toEqual(mockAbi);
      expect(contractRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contract not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(null);

      await expect(service.updateContractAbi('0x999', { abi: mockAbi })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return contract without update when no updates provided', async () => {
      contractRepo.findByAddress.mockResolvedValue(mockContract);

      const dto: UpdateContractAbiDto = {}; // 빈 DTO
      const result = await service.updateContractAbi('0x123', dto);

      expect(result).toEqual(expect.objectContaining({ address: mockContract.address }));
      expect(contractRepo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when contract not found after update', async () => {
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract) // 첫 번째 호출 (조회)
        .mockResolvedValueOnce(null); // 두 번째 호출 (업데이트 후 조회)
      contractRepo.update.mockResolvedValue(undefined);

      const dto: UpdateContractAbiDto = { abi: mockAbi };
      await expect(service.updateContractAbi('0x123', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle undefined and null values in DTO', async () => {
      const updatedContract = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);

      const dto: UpdateContractAbiDto = {
        abi: undefined,
        bytecode: null,
        name: undefined,
      };
      const result = await service.updateContractAbi('0x123', dto);

      expect(result).toBeDefined();
      expect(contractRepo.update).not.toHaveBeenCalled(); // 업데이트할 필드가 없으므로
    });

    it('should cache methods when ABI is updated', async () => {
      const updatedContract = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);
      methodRepo.deleteByContractAddress.mockResolvedValue(undefined);
      methodRepo.saveMany.mockResolvedValue([]);

      const dto: UpdateContractAbiDto = { abi: mockAbi };
      await service.updateContractAbi('0x123', dto);

      expect(methodRepo.deleteByContractAddress).toHaveBeenCalledWith('0x123');
      expect(methodRepo.saveMany).toHaveBeenCalled();
    });

    it('should not cache methods when ABI is not updated', async () => {
      const updatedContract = { ...mockContract, name: 'UpdatedName' };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);

      const dto: UpdateContractAbiDto = { name: 'UpdatedName' };
      await service.updateContractAbi('0x123', dto);

      expect(methodRepo.deleteByContractAddress).not.toHaveBeenCalled();
    });

    it('should not cache methods when updated.abi is null', async () => {
      const updatedContract = { ...mockContract, abi: null };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);

      const dto: UpdateContractAbiDto = { abi: null };
      await service.updateContractAbi('0x123', dto);

      expect(methodRepo.deleteByContractAddress).not.toHaveBeenCalled();
    });

    it('should not cache methods when updates.abi is falsy', async () => {
      const updatedContract = { ...mockContract, abi: [] };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);

      const dto: UpdateContractAbiDto = { name: 'Test' };
      await service.updateContractAbi('0x123', dto);

      expect(methodRepo.deleteByContractAddress).not.toHaveBeenCalled();
    });
  });

  describe('executeContract', () => {
    it('should execute contract method', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      methodRepo.findByContractAndMethod.mockResolvedValue(null);
      methodRepo.save.mockResolvedValue({} as ContractMethod);
      chainClient.executeContract.mockResolvedValue({
        hash: '0xexecHash',
        status: 'pending',
      });

      const dto: ExecuteContractDto = { methodName: 'setValue', params: ['42'] };
      const result = await service.executeContract('0x123', dto);

      expect(result.transactionHash).toBe('0xexecHash');
      expect(chainClient.executeContract).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contract not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(null);

      await expect(
        service.executeContract('0x999', { methodName: 'setValue', params: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when ABI not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(mockContract);

      await expect(
        service.executeContract('0x123', { methodName: 'setValue', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when method not found in ABI', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      methodRepo.findByContractAndMethod.mockResolvedValue(null);

      await expect(
        service.executeContract('0x123', { methodName: 'nonExistentMethod', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use cached method when available', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      const cachedMethod = {
        contractAddress: '0x123',
        methodName: 'setValue',
        methodSignature: '0xa6f9dae1',
      } as ContractMethod;
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      methodRepo.findByContractAndMethod.mockResolvedValue(cachedMethod);
      chainClient.executeContract.mockResolvedValue({
        hash: '0xexecHash',
        status: 'pending',
      });

      const dto: ExecuteContractDto = { methodName: 'setValue', params: ['42'] };
      const result = await service.executeContract('0x123', dto);

      expect(result.transactionHash).toBe('0xexecHash');
      expect(methodRepo.save).not.toHaveBeenCalled();
    });

    it('should handle generic errors in executeContract', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      methodRepo.findByContractAndMethod.mockResolvedValue(null);
      methodRepo.save.mockResolvedValue({} as ContractMethod);
      chainClient.executeContract.mockRejectedValue(new Error('Chain error'));

      const dto: ExecuteContractDto = { methodName: 'setValue', params: ['42'] };
      await expect(service.executeContract('0x123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle ABI with empty array', async () => {
      contractRepo.findByAddress.mockResolvedValue({ ...mockContract, abi: [] });

      await expect(
        service.executeContract('0x123', { methodName: 'setValue', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('callContract', () => {
    it('should call contract method and decode result', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      methodRepo.findByContractAndMethod.mockResolvedValue(null);
      methodRepo.save.mockResolvedValue({} as ContractMethod);
      chainClient.callContract.mockResolvedValue({
        result: '0x0000000000000000000000000000000000000000000000000000000000000042',
        gasUsed: '0x100',
      });

      const dto: CallContractDto = { methodName: 'getValue', params: [] };
      const result = await service.callContract('0x123', dto);

      expect(result.result).toBeDefined();
      expect(chainClient.callContract).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contract not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(null);

      await expect(
        service.callContract('0x999', { methodName: 'getValue', params: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle decode error gracefully', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      methodRepo.findByContractAndMethod.mockResolvedValue(null);
      methodRepo.save.mockResolvedValue({} as ContractMethod);
      chainClient.callContract.mockResolvedValue({
        result: '0xinvalid',
        gasUsed: '0x100',
      });

      const dto: CallContractDto = { methodName: 'getValue', params: [] };
      const result = await service.callContract('0x123', dto);

      expect(result.result).toBe('0xinvalid');
      expect(result.decodedResult).toBeNull();
    });

          it('should use cached method when available', async () => {
            const contractWithAbi = { ...mockContract, abi: mockAbi };
            const cachedMethod = {
              contractAddress: '0x123',
              methodName: 'getValue',
              methodSignature: '0x55241077',
            } as ContractMethod;
            contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
            methodRepo.findByContractAndMethod.mockResolvedValue(cachedMethod);
            chainClient.callContract.mockResolvedValue({
              result: '0x42',
              gasUsed: '0x100',
            });

            const dto: CallContractDto = { methodName: 'getValue', params: [] };
            const result = await service.callContract('0x123', dto);

            expect(result.result).toBeDefined();
            expect(methodRepo.save).not.toHaveBeenCalled();
          });

          it('should handle generic errors in callContract', async () => {
            const contractWithAbi = { ...mockContract, abi: mockAbi };
            contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
            methodRepo.findByContractAndMethod.mockResolvedValue(null);
            methodRepo.save.mockResolvedValue({} as ContractMethod);
            chainClient.callContract.mockRejectedValue(new Error('Chain error'));

            const dto: CallContractDto = { methodName: 'getValue', params: [] };
            await expect(service.callContract('0x123', dto)).rejects.toThrow(
              BadRequestException,
            );
          });

          it('should handle ABI with empty array in callContract', async () => {
            contractRepo.findByAddress.mockResolvedValue({ ...mockContract, abi: [] });

            await expect(
              service.callContract('0x123', { methodName: 'getValue', params: [] }),
            ).rejects.toThrow(BadRequestException);
          });

          it('should handle decode error with single result', async () => {
            const contractWithAbi = { ...mockContract, abi: mockAbi };
            contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
            methodRepo.findByContractAndMethod.mockResolvedValue(null);
            methodRepo.save.mockResolvedValue({} as ContractMethod);
            chainClient.callContract.mockResolvedValue({
              result: '0x0000000000000000000000000000000000000000000000000000000000000042',
              gasUsed: '0x100',
            });

            const dto: CallContractDto = { methodName: 'getValue', params: [] };
            const result = await service.callContract('0x123', dto);

            expect(result.decodedResult).toBeDefined();
          });

          it('should handle multiple return values', async () => {
            const multiReturnAbi = [
              {
                inputs: [],
                name: 'getMultiple',
                outputs: [
                  { internalType: 'uint256', name: 'a', type: 'uint256' },
                  { internalType: 'uint256', name: 'b', type: 'uint256' },
                ],
                stateMutability: 'view',
                type: 'function',
              },
            ];
            const contractWithAbi = { ...mockContract, abi: multiReturnAbi };
            contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
            methodRepo.findByContractAndMethod.mockResolvedValue(null);
            methodRepo.save.mockResolvedValue({} as ContractMethod);
            chainClient.callContract.mockResolvedValue({
              result: '0x00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000042',
              gasUsed: '0x100',
            });

            const dto: CallContractDto = { methodName: 'getMultiple', params: [] };
            const result = await service.callContract('0x123', dto);

            expect(Array.isArray(result.decodedResult)).toBe(true);
          });

          it('should handle decode error branch', async () => {
            const contractWithAbi = { ...mockContract, abi: mockAbi };
            contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
            methodRepo.findByContractAndMethod.mockResolvedValue(null);
            methodRepo.save.mockResolvedValue({} as ContractMethod);
            // 디코딩 실패하는 결과
            chainClient.callContract.mockResolvedValue({
              result: '0xinvalidhex',
              gasUsed: '0x100',
            });

            const dto: CallContractDto = { methodName: 'getValue', params: [] };
            const result = await service.callContract('0x123', dto);

            // 디코딩 실패해도 원본 결과는 반환되어야 함
            expect(result.result).toBe('0xinvalidhex');
            expect(result.decodedResult).toBeNull();
          });
        });

  describe('cacheContractMethods', () => {
    it('should cache contract methods when ABI is updated', async () => {
      const updatedContract = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValueOnce(mockContract).mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);
      methodRepo.deleteByContractAddress.mockResolvedValue(undefined);
      methodRepo.saveMany.mockResolvedValue([]);

      const dto: UpdateContractAbiDto = { abi: mockAbi };
      await service.updateContractAbi('0x123', dto);

      expect(methodRepo.deleteByContractAddress).toHaveBeenCalledWith('0x123');
      expect(methodRepo.saveMany).toHaveBeenCalled();
    });

    it('should not save methods when methods array is empty', async () => {
      const abiWithoutFunctions = [
        { type: 'event', name: 'SomeEvent', inputs: [] },
        { type: 'constructor', inputs: [] },
      ];
      const updatedContract = { ...mockContract, abi: abiWithoutFunctions };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);
      methodRepo.deleteByContractAddress.mockResolvedValue(undefined);

      const dto: UpdateContractAbiDto = { abi: abiWithoutFunctions };
      await service.updateContractAbi('0x123', dto);

      expect(methodRepo.saveMany).not.toHaveBeenCalled();
    });

    it('should handle cache error gracefully', async () => {
      const updatedContract = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);
      methodRepo.deleteByContractAddress.mockRejectedValue(new Error('Cache error'));

      const dto: UpdateContractAbiDto = { abi: mockAbi };
      const result = await service.updateContractAbi('0x123', dto);

      expect(result).toBeDefined();
    });

    it('should handle saveMany error gracefully', async () => {
      const updatedContract = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);
      methodRepo.deleteByContractAddress.mockResolvedValue(undefined);
      methodRepo.saveMany.mockRejectedValue(new Error('Save error'));

      const dto: UpdateContractAbiDto = { abi: mockAbi };
      const result = await service.updateContractAbi('0x123', dto);

      expect(result).toBeDefined();
    });
  });

  describe('cacheMethod', () => {
    it('should handle method with selector', () => {
      const fragment = {
        name: 'testMethod',
        type: 'function',
        inputs: [{ name: 'value', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'nonpayable',
      };
      const result = (service as any).cacheMethod('0x123', fragment);
      expect(result.methodName).toBe('testMethod');
      expect(result.methodSignature).toBeDefined();
    });

    it('should handle method without stateMutability', () => {
      const fragment = {
        name: 'testMethod',
        type: 'function',
        inputs: [],
      };
      const result = (service as any).cacheMethod('0x123', fragment);
      expect(result.stateMutability).toBeNull();
    });

    it('should handle method with empty inputs array', () => {
      const fragment = {
        name: 'testMethod',
        type: 'function',
        inputs: [],
        stateMutability: 'view',
      };
      const result = (service as any).cacheMethod('0x123', fragment);
      expect(result.inputs).toEqual([]);
    });

    it('should handle input without name', () => {
      const fragment = {
        name: 'testMethod',
        type: 'function',
        inputs: [{ type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view',
      };
      const result = (service as any).cacheMethod('0x123', fragment);
      expect(result.inputs[0].name).toBe('');
    });

    it('should handle method selector not found', () => {
      const fragment = {
        name: 'testMethod',
        type: 'function',
        inputs: [],
        stateMutability: 'view',
      };
      const result = (service as any).cacheMethod('0x123', fragment);
      expect(result.methodSignature).toBeDefined();
    });

    it('should handle fragment with stateMutability', () => {
      const fragment = {
        name: 'testMethod',
        type: 'function',
        inputs: [],
        stateMutability: 'payable',
      };
      const result = (service as any).cacheMethod('0x123', fragment);
      expect(result.stateMutability).toBe('payable');
    });
  });

  describe('toDto', () => {
    it('should return status 0 when bytecode is null', () => {
      const contractWithoutBytecode = { ...mockContract, bytecode: null };
      const result = (service as any).toDto(contractWithoutBytecode);
      expect(result.status).toBe(0);
    });

    it('should return status 0 when bytecode is "0x"', () => {
      const contractWithEmptyBytecode = { ...mockContract, bytecode: '0x' };
      const result = (service as any).toDto(contractWithEmptyBytecode);
      expect(result.status).toBe(0);
    });

    it('should return status 1 when bytecode exists and is not "0x"', () => {
      const contractWithBytecode = { ...mockContract, bytecode: '0x6080604052' };
      const result = (service as any).toDto(contractWithBytecode);
      expect(result.status).toBe(1);
    });
  });
});

