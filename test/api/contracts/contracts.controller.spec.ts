import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from '../../../apps/api/src/contracts/contracts.controller';
import { ContractsService } from '../../../apps/api/src/contracts/contracts.service';
import { CallContractDto, CallContractResponseDto } from '../../../apps/api/src/contracts/dto/call-contract.dto';
import { ContractResponseDto } from '../../../apps/api/src/contracts/dto/contract-response.dto';
import { DeployContractDto, DeployContractResponseDto } from '../../../apps/api/src/contracts/dto/deploy-contract.dto';
import { ExecuteContractDto, ExecuteContractResponseDto } from '../../../apps/api/src/contracts/dto/execute-contract.dto';
import { UpdateContractAbiDto } from '../../../apps/api/src/contracts/dto/update-contract-abi.dto';
import { CommonResponseDto, PaginatedResponseDto } from '../../../apps/api/src/common/dto';

describe('ContractsController', () => {
  let controller: ContractsController;
  let service: jest.Mocked<ContractsService>;

  const mockContract: ContractResponseDto = {
    address: '0x123',
    deployer: '0xdeployer',
    transactionHash: '0xtxhash',
    blockNumber: '100',
    blockHash: '0xblockhash',
    bytecode: '0x6080604052',
    status: 1,
    abi: null,
    name: null,
    sourceCode: null,
    compilerVersion: null,
    optimization: null,
    timestamp: '1633024800',
    createdAt: '2021-10-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const mockService = {
      getContracts: jest.fn(),
      getContractsByDeployer: jest.fn(),
      getContract: jest.fn(),
      deployContract: jest.fn(),
      updateContractAbi: jest.fn(),
      executeContract: jest.fn(),
      callContract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        {
          provide: ContractsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ContractsController>(ContractsController);
    service = module.get(ContractsService);
  });

  describe('getContracts', () => {
    it('should return paginated contracts', async () => {
      service.getContracts.mockResolvedValue({
        contracts: [mockContract],
        totalCount: 1,
      });

      const result = await controller.getContracts(1, 20);

      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data.items).toHaveLength(1);
      expect(service.getContracts).toHaveBeenCalledWith(1, 20);
    });

    it('should limit max page size to 100', async () => {
      service.getContracts.mockResolvedValue({
        contracts: [],
        totalCount: 0,
      });

      await controller.getContracts(1, 200);

      expect(service.getContracts).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('getContract', () => {
    it('should return contract by address', async () => {
      service.getContract.mockResolvedValue(mockContract);

      const result = await controller.getContract('0x123');

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.address).toBe('0x123');
      expect(service.getContract).toHaveBeenCalledWith('0x123');
    });
  });

  describe('deployContract', () => {
    it('should deploy contract', async () => {
      const deployResult: DeployContractResponseDto = {
        transactionHash: '0xdeployhash',
        status: 'pending',
        contractAddress: null,
      };
      service.deployContract.mockResolvedValue(deployResult);

      const dto: DeployContractDto = { bytecode: '0x6080604052' };
      const result = await controller.deployContract(dto);

      expect(result.data.transactionHash).toBe('0xdeployhash');
      expect(service.deployContract).toHaveBeenCalledWith(dto);
    });
  });

  describe('getContractsByDeployer', () => {
    it('should return contracts filtered by deployer', async () => {
      const paginated = {
        contracts: [mockContract],
        totalCount: 1,
      };
      service.getContractsByDeployer.mockResolvedValue(paginated);

      const result = await controller.getContractsByDeployer('0xabc', 1, 20);

      expect(result.data.items).toHaveLength(1);
      expect(result.data.pagination.totalCount).toBe(1);
      expect(service.getContractsByDeployer).toHaveBeenCalledWith('0xabc', 1, 20);
    });
  });

  describe('updateContractAbi', () => {
    it('should update contract ABI with DTO', async () => {
      const updatedContract = { ...mockContract, abi: [{ type: 'function' }] };
      service.updateContractAbi.mockResolvedValue(updatedContract);

      const dto: UpdateContractAbiDto = { abi: [{ type: 'function' }] };

      const result = await controller.updateContractAbi('0x123', dto);

      expect(result.data.abi).toBeDefined();
      expect(service.updateContractAbi).toHaveBeenCalledWith('0x123', dto);
    });

    it('should update contract ABI with optional fields', async () => {
      const updatedContract = {
        ...mockContract,
        abi: [{ type: 'function' }],
        name: 'MyContract',
        compilerVersion: '0.8.20',
      };
      service.updateContractAbi.mockResolvedValue(updatedContract);

      const dto: UpdateContractAbiDto = {
        abi: [{ type: 'function' }],
        name: 'MyContract',
        compilerVersion: '0.8.20',
      };

      const result = await controller.updateContractAbi('0x123', dto);

      expect(result.data.abi).toBeDefined();
      expect(result.data.name).toBe('MyContract');
      expect(service.updateContractAbi).toHaveBeenCalledWith('0x123', dto);
    });
  });

  describe('executeContract', () => {
    it('should execute contract method', async () => {
      const executeResult: ExecuteContractResponseDto = {
        transactionHash: '0xexecHash',
        status: 'pending',
      };
      service.executeContract.mockResolvedValue(executeResult);

      const dto: ExecuteContractDto = { methodName: 'setValue', params: ['42'] };
      const result = await controller.executeContract('0x123', dto);

      expect(result.data.transactionHash).toBe('0xexecHash');
      expect(service.executeContract).toHaveBeenCalledWith('0x123', dto);
    });
  });

  describe('callContract', () => {
    it('should call contract method', async () => {
      const callResult: CallContractResponseDto = {
        result: '0x42',
        gasUsed: '0x100',
        decodedResult: 42,
      };
      service.callContract.mockResolvedValue(callResult);

      const dto: CallContractDto = { methodName: 'getValue', params: [] };
      const result = await controller.callContract('0x123', dto);

      expect(result.data.result).toBe('0x42');
      expect(service.callContract).toHaveBeenCalledWith('0x123', dto);
    });
  });
});

