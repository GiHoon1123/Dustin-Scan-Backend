import { ChainClientService } from '@app/chain-client';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { StablecoinService } from '../../../apps/api/src/stablecoin/stablecoin.service';

// axios 모킹
jest.mock('axios');

describe('StablecoinService', () => {
  let service: StablecoinService;
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
        StablecoinService,
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<StablecoinService>(StablecoinService);
    chainClient = module.get(ChainClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CHAIN_URL;
  });

  describe('depositCollateral', () => {
    it('should convert DSTN to hex wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhash123',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트로부터 DSTN 단위로 받음 (예: "1" DSTN)
      const result = await service.depositCollateral('0xprivatekey', '1');

      // 코어로는 hex wei 단위로 전송 (1 DSTN = 0xde0b6b3a7640000 wei)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/deposit', {
        privateKey: '0xprivatekey',
        amount: '0xde0b6b3a7640000',
      });
      expect(result).toEqual({
        hash: '0xtxhash123',
        status: 'pending',
      });
    });

    it('should handle decimal amounts correctly', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhashdec1',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 소수점 테스트: 0.5 DSTN
      const result = await service.depositCollateral('0xprivatekey', '0.5');

      // 0.5 DSTN = 500000000000000000 wei = 0x6f05b59d3b20000
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/deposit', {
        privateKey: '0xprivatekey',
        amount: '0x6f05b59d3b20000',
      });
      expect(result).toEqual({
        hash: '0xtxhashdec1',
        status: 'pending',
      });
    });
  });

  describe('mintStablecoin', () => {
    it('should convert DSTN to hex wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhash456',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트로부터 DSTN 단위로 받음 (예: "500" DSTN)
      const result = await service.mintStablecoin('0xprivatekey', '500');

      // 코어로는 hex wei 단위로 전송 (500 DSTN = 0x1b1ae4d6e2ef500000 wei)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/mint', {
        privateKey: '0xprivatekey',
        stablecoinAmount: '0x1b1ae4d6e2ef500000',
      });
      expect(result).toEqual({
        hash: '0xtxhash456',
        status: 'pending',
      });
    });

    it('should handle decimal amounts correctly', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhashdec2',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 소수점 테스트: 100.5 DSTN
      const result = await service.mintStablecoin('0xprivatekey', '100.5');

      // 100.5 DSTN = 100500000000000000000 wei = 0x572b7b98736c20000
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/mint', {
        privateKey: '0xprivatekey',
        stablecoinAmount: '0x572b7b98736c20000',
      });
      expect(result).toEqual({
        hash: '0xtxhashdec2',
        status: 'pending',
      });
    });
  });

  describe('redeemStablecoin', () => {
    it('should convert DSTN to hex wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhash789',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트로부터 DSTN 단위로 받음 (예: "200" DSTN)
      const result = await service.redeemStablecoin('0xprivatekey', '200');

      // 코어로는 hex wei 단위로 전송 (200 DSTN = 0xad78ebc5ac6200000 wei)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/redeem', {
        privateKey: '0xprivatekey',
        stablecoinAmount: '0xad78ebc5ac6200000',
      });
      expect(result).toEqual({
        hash: '0xtxhash789',
        status: 'pending',
      });
    });
  });

  describe('withdrawCollateral', () => {
    it('should convert DSTN to hex wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhashabc',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트로부터 DSTN 단위로 받음 (예: "0.5" DSTN)
      const result = await service.withdrawCollateral('0xprivatekey', '0.5');

      // 코어로는 hex wei 단위로 전송 (0.5 DSTN = 0x6f05b59d3b20000 wei)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/withdraw', {
        privateKey: '0xprivatekey',
        amount: '0x6f05b59d3b20000',
      });
      expect(result).toEqual({
        hash: '0xtxhashabc',
        status: 'pending',
      });
    });

    it('should handle decimal amounts correctly', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhashdec',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 소수점 테스트: 1.5 DSTN
      const result = await service.withdrawCollateral('0xprivatekey', '1.5');

      // 1.5 DSTN = 1500000000000000000 wei = 0x14d1120d7b160000
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/withdraw', {
        privateKey: '0xprivatekey',
        amount: '0x14d1120d7b160000',
      });
      expect(result).toEqual({
        hash: '0xtxhashdec',
        status: 'pending',
      });
    });
  });

  describe('liquidate', () => {
    it('should call core API and return transaction hash', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhashdef',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.liquidate(
        '0xprivatekey',
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/liquidate', {
        privateKey: '0xprivatekey',
        userAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      });
      expect(result).toEqual({
        hash: '0xtxhashdef',
        status: 'pending',
      });
    });
  });

  describe('getPosition', () => {
    it('should decode position data from core API response', async () => {
      const mockResponse = {
        data: {
          collateralAmount: '0xde0b6b3a7640000', // 1 DSTN in wei
          debtAmount: '0x6f05b59d3b20000', // 0.5 DSTN in wei
          collateralRatio: '0x1bc16d674ec80000', // 200% (2.0 * 10^18)
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getPosition('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/stablecoin/position/0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result.collateralAmount).toBe('1000000000000000000');
      expect(result.debtAmount).toBe('500000000000000000');
      expect(result.collateralRatio).toBe('2000000000000000000');
    });

    it('should handle zero values', async () => {
      const mockResponse = {
        data: {
          collateralAmount: '0x0',
          debtAmount: '0x',
          collateralRatio: '0x0',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getPosition('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(result.collateralAmount).toBe('0');
      expect(result.debtAmount).toBe('0');
      expect(result.collateralRatio).toBe('0');
    });
  });

  describe('getHealth', () => {
    it('should decode health status from core API response (true)', async () => {
      const mockResponse = {
        data: {
          result: '0x1',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getHealth('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/stablecoin/health/0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result.isHealthy).toBe(true);
    });

    it('should decode health status from core API response (false)', async () => {
      const mockResponse = {
        data: {
          result: '0x0',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getHealth('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(result.isHealthy).toBe(false);
    });
  });
});

