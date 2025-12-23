import { ChainClientService } from '@app/chain-client';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { StakingService } from '../../../apps/api/src/staking/staking.service';

// axios 모킹
jest.mock('axios');

describe('StakingService', () => {
  let service: StakingService;
  let chainClient: jest.Mocked<ChainClientService>;
  let mockAxiosInstance: any;

  const mockChainUrl = 'http://localhost:3000';

  beforeEach(async () => {
    // 환경 변수 설정
    process.env.CHAIN_URL = mockChainUrl;

    // axios.create 모킹
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };
    (axios.create as jest.Mock) = jest.fn(() => mockAxiosInstance);

    const mockChainClient = {
      getLatestBlock: jest.fn(),
      getBlockByNumber: jest.fn(),
      getBlockByHash: jest.fn(),
      getChainStats: jest.fn(),
      getTransaction: jest.fn(),
      getReceipt: jest.fn(),
      getAccount: jest.fn(),
      getContractBytecode: jest.fn(),
      createWallet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StakingService,
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<StakingService>(StakingService);
    chainClient = module.get(ChainClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CHAIN_URL;
  });

  describe('deposit', () => {
    it('should convert DSTN to hex Wei, call core API, and wait for confirmation', async () => {
      const mockTxResponse = {
        data: {
          hash: '0xtxhash123',
          status: 'pending',
        },
      };

      const mockReceipt = {
        transactionHash: '0xtxhash123',
        transactionIndex: '0x0',
        blockNumber: '0x3039', // 12345 in hex
        blockHash: '0xblockhash123',
        from: '0xfrom',
        to: '0xto',
        gasUsed: '0x5208', // 21000 in hex
        cumulativeGasUsed: '0x5208', // 21000 in hex
        status: '0x1', // 성공 (hex string)
        contractAddress: null,
        logs: [],
        logsBloom: '0x',
      };

      mockAxiosInstance.post.mockResolvedValue(mockTxResponse);
      chainClient.getReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "32")
      const result = await service.deposit('0xprivatekey', '32');

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/staking/deposit', {
        privateKey: '0xprivatekey',
        amount: '0x1bc16d674ec800000', // 32 DSTN = 32000000000000000000 Wei = 0x1bc16d674ec800000
      });

      // 트랜잭션이 블록에 반영될 때까지 대기
      expect(chainClient.getReceipt).toHaveBeenCalledWith('0xtxhash123');
      expect(result).toEqual({
        hash: '0xtxhash123',
        status: 'confirmed',
        blockNumber: '12345',
        blockHash: '0xblockhash123',
      });
    });

    it('should handle failed transaction', async () => {
      const mockTxResponse = {
        data: {
          hash: '0xtxhash456',
          status: 'pending',
        },
      };

      const mockReceipt = {
        transactionHash: '0xtxhash456',
        transactionIndex: '0x0',
        blockNumber: '0x303a', // 12346 in hex
        blockHash: '0xblockhash456',
        from: '0xfrom',
        to: '0xto',
        gasUsed: '0x5208',
        cumulativeGasUsed: '0x5208',
        status: '0x0', // 실패
        contractAddress: null,
        logs: [],
        logsBloom: '0x',
      };

      mockAxiosInstance.post.mockResolvedValue(mockTxResponse);
      chainClient.getReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      const result = await service.deposit('0xprivatekey', '32.5');

      expect(result).toEqual({
        hash: '0xtxhash456',
        status: 'failed',
        blockNumber: '12346',
        blockHash: '0xblockhash456',
      });
    });
  });

  describe('setWithdrawalAddress', () => {
    it('should call core API and wait for confirmation', async () => {
      const mockTxResponse = {
        data: {
          hash: '0xtxhash789',
          status: 'pending',
        },
      };

      const mockReceipt = {
        transactionHash: '0xtxhash789',
        transactionIndex: '0x0',
        blockNumber: '0x303b',
        blockHash: '0xblockhash789',
        from: '0xfrom',
        to: '0xto',
        gasUsed: '0x5208',
        cumulativeGasUsed: '0x5208',
        status: '0x1',
        contractAddress: null,
        logs: [],
        logsBloom: '0x',
      };

      mockAxiosInstance.post.mockResolvedValue(mockTxResponse);
      chainClient.getReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      const result = await service.setWithdrawalAddress(
        '0xprivatekey',
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/staking/set-withdrawal-address', {
        privateKey: '0xprivatekey',
        withdrawalAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      });

      expect(result).toEqual({
        hash: '0xtxhash789',
        status: 'confirmed',
        blockNumber: '12347',
        blockHash: '0xblockhash789',
      });
    });
  });

  describe('requestWithdrawal', () => {
    it('should call core API and wait for confirmation', async () => {
      const mockTxResponse = {
        data: {
          hash: '0xtxhashabc',
          status: 'pending',
        },
      };

      const mockReceipt = {
        transactionHash: '0xtxhashabc',
        transactionIndex: '0x0',
        blockNumber: '0x303c',
        blockHash: '0xblockhashabc',
        from: '0xfrom',
        to: '0xto',
        gasUsed: '0x5208',
        cumulativeGasUsed: '0x5208',
        status: '0x1',
        contractAddress: null,
        logs: [],
        logsBloom: '0x',
      };

      mockAxiosInstance.post.mockResolvedValue(mockTxResponse);
      chainClient.getReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      const result = await service.requestWithdrawal('0xprivatekey');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/staking/request-withdrawal', {
        privateKey: '0xprivatekey',
      });

      expect(result).toEqual({
        hash: '0xtxhashabc',
        status: 'confirmed',
        blockNumber: '12348',
        blockHash: '0xblockhashabc',
      });
    });
  });

  describe('getValidator', () => {
    it('should decode validator data and convert to DSTN (both DSTN and Wei)', async () => {
      const mockResponse = {
        data: {
          validatorAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
          stakedAmount: '0x1bc16d674ec800000', // 32 DSTN in wei
          status: 'active_ongoing',
          withdrawalAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
          activatedAt: '0x63b0cd00', // 1672531200 in hex
          exitRequestedAt: '0x0',
          totalRewards: '0x6f05b59d3b20000', // 0.5 DSTN in wei
          slashedAmount: '0x0',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getValidator('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/staking/validator/0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );

      expect(result.validatorAddress).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');
      expect(result.stakedAmount).toBe('32.0'); // DSTN 단위
      expect(result.stakedAmountWei).toBe('32000000000000000000'); // Wei 단위
      expect(result.status).toBe('active_ongoing');
      expect(result.withdrawalAddress).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');
      expect(result.activatedAt).toBe('1672531200');
      expect(result.exitRequestedAt).toBe('0');
      expect(result.totalRewards).toBe('0.5'); // DSTN 단위
      expect(result.totalRewardsWei).toBe('500000000000000000'); // Wei 단위
      expect(result.slashedAmount).toBe('0.0');
      expect(result.slashedAmountWei).toBe('0');
    });

    it('should handle zero values', async () => {
      const mockResponse = {
        data: {
          validatorAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
          stakedAmount: '0x0',
          status: 'pending_initialized',
          withdrawalAddress: '0x0000000000000000000000000000000000000000',
          activatedAt: '0x0',
          exitRequestedAt: '0x0',
          totalRewards: '0x0',
          slashedAmount: '0x0',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getValidator('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(result.stakedAmount).toBe('0.0');
      expect(result.stakedAmountWei).toBe('0');
      expect(result.totalRewards).toBe('0.0');
      expect(result.totalRewardsWei).toBe('0');
      expect(result.slashedAmount).toBe('0.0');
      expect(result.slashedAmountWei).toBe('0');
    });
  });

  describe('getValidators', () => {
    it('should decode validators array and convert to DSTN', async () => {
      const mockResponse = {
        data: {
          validators: [
            {
              validatorAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
              stakedAmount: '0x1bc16d674ec800000', // 32 DSTN
              status: 'active_ongoing',
              withdrawalAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
              activatedAt: '0x63f8a8c0',
              exitRequestedAt: '0x0',
              totalRewards: '0x6f05b59d3b20000', // 0.5 DSTN
              slashedAmount: '0x0',
            },
            {
              validatorAddress: '0x1234567890123456789012345678901234567890',
              stakedAmount: '0x3782dace9d9000000', // 64 DSTN
              status: 'active_ongoing',
              withdrawalAddress: '0x1234567890123456789012345678901234567890',
              activatedAt: '0x63f8a8c0',
              exitRequestedAt: '0x0',
              totalRewards: '0xde0b6b3a7640000', // 1 DSTN
              slashedAmount: '0x0',
            },
          ],
          total: 2,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getValidators();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/staking/validators');
      expect(result.total).toBe(2);
      expect(result.validators).toHaveLength(2);
      expect(result.validators[0].stakedAmount).toBe('32.0');
      expect(result.validators[0].stakedAmountWei).toBe('32000000000000000000');
      expect(result.validators[1].stakedAmount).toBe('64.0');
      expect(result.validators[1].stakedAmountWei).toBe('64000000000000000000');
    });
  });

  describe('getStats', () => {
    it('should decode stats data and convert to DSTN (both DSTN and Wei)', async () => {
      const mockResponse = {
        data: {
          totalStaked: '0x21e19e0c9bab2400000', // 10000 DSTN in wei
          totalValidators: 10,
          activeValidators: 8,
          totalRewards: '0x1bc16d674ec800000', // 32 DSTN in wei
          totalSlashed: '0x0',
          minStake: '0x1bc16d674ec800000', // 32 DSTN in wei
          maxValidators: 100,
          withdrawalDelay: '0x3c', // 60 seconds in hex
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getStats();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/staking/stats');

      expect(result.totalStaked).toBe('10000.0'); // DSTN 단위
      expect(result.totalStakedWei).toBe('10000000000000000000000'); // Wei 단위
      expect(result.totalValidators).toBe(10);
      expect(result.activeValidators).toBe(8);
      expect(result.totalRewards).toBe('32.0'); // DSTN 단위
      expect(result.totalRewardsWei).toBe('32000000000000000000'); // Wei 단위
      expect(result.totalSlashed).toBe('0.0');
      expect(result.totalSlashedWei).toBe('0');
      expect(result.minStake).toBe('32.0'); // DSTN 단위
      expect(result.minStakeWei).toBe('32000000000000000000'); // Wei 단위
      expect(result.maxValidators).toBe(100);
      expect(result.withdrawalDelay).toBe('60');
    });

    it('should handle zero values', async () => {
      const mockResponse = {
        data: {
          totalStaked: '0x0',
          totalValidators: 0,
          activeValidators: 0,
          totalRewards: '0x0',
          totalSlashed: '0x0',
          minStake: '0x1bc16d674ec8000000',
          maxValidators: 100,
          withdrawalDelay: '0x3c',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getStats();

      expect(result.totalStaked).toBe('0.0');
      expect(result.totalStakedWei).toBe('0');
      expect(result.totalValidators).toBe(0);
      expect(result.activeValidators).toBe(0);
      expect(result.totalRewards).toBe('0.0');
      expect(result.totalRewardsWei).toBe('0');
      expect(result.totalSlashed).toBe('0.0');
      expect(result.totalSlashedWei).toBe('0');
    });
  });
});

