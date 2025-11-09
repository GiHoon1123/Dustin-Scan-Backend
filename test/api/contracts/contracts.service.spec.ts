import { ChainClientService } from '@app/chain-client';
import { Contract, ContractRepository } from '@app/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from '../../../apps/api/src/contracts/contracts.service';
import { CallContractDto } from '../../../apps/api/src/contracts/dto/call-contract.dto';
import { ExecuteContractDto } from '../../../apps/api/src/contracts/dto/execute-contract.dto';
import { UpdateContractAbiDto } from '../../../apps/api/src/contracts/dto/update-contract-abi.dto';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractRepo: jest.Mocked<ContractRepository>;
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
      findPaginatedByDeployer: jest.fn(),
      findByAddress: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
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
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    contractRepo = module.get(ContractRepository);
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

  describe('getContractsByDeployer', () => {
    it('should return paginated contracts by deployer', async () => {
      contractRepo.findPaginatedByDeployer.mockResolvedValue([[mockContract], 1]);

      const deployer = '0xabc0000000000000000000000000000000000000';
      const result = await service.getContractsByDeployer(deployer, 2, 10);

      expect(result.contracts).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(contractRepo.findPaginatedByDeployer).toHaveBeenCalledWith(
        deployer,
        2,
        10,
      );
    });

    it('should throw BadRequestException for invalid address', async () => {
      await expect(service.getContractsByDeployer('invalid-address')).rejects.toThrow(
        BadRequestException,
      );
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
      contractRepo.findByAddress
        .mockResolvedValueOnce(mockContract)
        .mockResolvedValueOnce(updatedContract);
      contractRepo.update.mockResolvedValue(undefined);

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
  });

  describe('executeContract', () => {
    it('should execute contract method', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      chainClient.executeContract.mockResolvedValue({
        hash: '0xexecHash',
        status: 'pending',
      });

      const dto: ExecuteContractDto = { methodName: 'setValue', params: ['42'] };
      const result = await service.executeContract('0x123', dto);

      expect(result.transactionHash).toBe('0xexecHash');
      expect(result.status).toBe('pending');
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

      await expect(
        service.executeContract('0x123', { methodName: 'nonExistentMethod', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle ABI with empty array', async () => {
      contractRepo.findByAddress.mockResolvedValue({ ...mockContract, abi: [] });

      await expect(
        service.executeContract('0x123', { methodName: 'setValue', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle generic errors in executeContract', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      chainClient.executeContract.mockRejectedValue(new Error('Chain error'));

      const dto: ExecuteContractDto = { methodName: 'setValue', params: ['42'] };
      await expect(service.executeContract('0x123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('callContract', () => {
    it('should call contract method and decode result', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      chainClient.callContract.mockResolvedValue({
        result: '0x0000000000000000000000000000000000000000000000000000000000000042',
        gasUsed: '0x100',
      });

      const dto: CallContractDto = { methodName: 'getValue', params: [] };
      const result = await service.callContract('0x123', dto);

      expect(result.result).toBeDefined();
      expect(result.decodedResult).toBeDefined();
      expect(chainClient.callContract).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contract not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(null);

      await expect(
        service.callContract('0x999', { methodName: 'getValue', params: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when ABI not found', async () => {
      contractRepo.findByAddress.mockResolvedValue(mockContract);

      await expect(
        service.callContract('0x123', { methodName: 'getValue', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when method not found in ABI', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);

      await expect(
        service.callContract('0x123', { methodName: 'nonExistentMethod', params: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle decode error gracefully', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      chainClient.callContract.mockResolvedValue({
        result: '0xinvalid',
        gasUsed: '0x100',
      });

      const dto: CallContractDto = { methodName: 'getValue', params: [] };
      const result = await service.callContract('0x123', dto);

      expect(result.result).toBe('0xinvalid');
      expect(result.decodedResult).toBeNull();
    });

    it('should handle ABI with empty array', async () => {
      contractRepo.findByAddress.mockResolvedValue({ ...mockContract, abi: [] });

      await expect(
        service.callContract('0x123', { methodName: 'getValue', params: [] }),
      ).rejects.toThrow(BadRequestException);
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
      chainClient.callContract.mockResolvedValue({
        result:
          '0x00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000042',
        gasUsed: '0x100',
      });

      const dto: CallContractDto = { methodName: 'getMultiple', params: [] };
      const result = await service.callContract('0x123', dto);

      expect(Array.isArray(result.decodedResult)).toBe(true);
    });

    it('should handle generic errors in callContract', async () => {
      const contractWithAbi = { ...mockContract, abi: mockAbi };
      contractRepo.findByAddress.mockResolvedValue(contractWithAbi);
      chainClient.callContract.mockRejectedValue(new Error('Chain error'));

      const dto: CallContractDto = { methodName: 'getValue', params: [] };
      await expect(service.callContract('0x123', dto)).rejects.toThrow(
        BadRequestException,
      );
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
