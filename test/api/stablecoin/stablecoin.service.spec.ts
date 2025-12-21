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
    it('should convert DSTN to hex Wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhash123',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "1")
      const result = await service.depositCollateral('0xprivatekey', '1');

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/deposit', {
        privateKey: '0xprivatekey',
        amount: '0xde0b6b3a7640000', // 1 DSTN = 1000000000000000000 Wei = 0xde0b6b3a7640000
      });
      expect(result).toEqual({
        hash: '0xtxhash123',
        status: 'pending',
      });
    });
  });

  describe('mintStablecoin', () => {
    it('should convert DSTN to hex Wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhash456',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "500")
      const result = await service.mintStablecoin('0xprivatekey', '500');

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/mint', {
        privateKey: '0xprivatekey',
        stablecoinAmount: '0x1b1ae4d6e2ef500000', // 500 DSTN = 500000000000000000000 Wei = 0x1b1ae4d6e2ef500000
      });
      expect(result).toEqual({
        hash: '0xtxhash456',
        status: 'pending',
      });
    });
  });

  describe('redeemStablecoin', () => {
    it('should convert DSTN to hex Wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhash789',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "200")
      const result = await service.redeemStablecoin('0xprivatekey', '200');

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/redeem', {
        privateKey: '0xprivatekey',
        stablecoinAmount: '0xad78ebc5ac6200000', // 200 DSTN = 200000000000000000000 Wei = 0xad78ebc5ac6200000
      });
      expect(result).toEqual({
        hash: '0xtxhash789',
        status: 'pending',
      });
    });
  });

  describe('withdrawCollateral', () => {
    it('should convert DSTN to hex Wei and call core API', async () => {
      const mockResponse = {
        data: {
          hash: '0xtxhashabc',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "0.5")
      const result = await service.withdrawCollateral('0xprivatekey', '0.5');

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/withdraw', {
        privateKey: '0xprivatekey',
        amount: '0x6f05b59d3b20000', // 0.5 DSTN = 500000000000000000 Wei = 0x6f05b59d3b20000
      });
      expect(result).toEqual({
        hash: '0xtxhashabc',
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
    it('should decode position data and convert to DSTN (both DSTN and Wei)', async () => {
      const mockResponse = {
        data: {
          collateralAmount: '0xde0b6b3a7640000', // 1 DSTN in wei
          debtAmount: '0x6f05b59d3b20000', // 0.5 DSTN in wei
          // 코어에서 비율만 반환 (배수)
          collateralRatio: '0xc8', // 200 (2.0배)
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getPosition('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/stablecoin/position/0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      // DSTN 단위
      expect(result.collateralAmount).toBe('1.0');
      expect(result.debtAmount).toBe('0.5');
      // Wei 단위
      expect(result.collateralAmountWei).toBe('1000000000000000000');
      expect(result.debtAmountWei).toBe('500000000000000000');
      // 비율
      expect(result.collateralRatio).toBe('200');
    });

    it('should handle collateralRatio with large values', async () => {
      const mockResponse = {
        data: {
          collateralAmount: '0xde0b6b3a7640000', // 1 DSTN in wei
          debtAmount: '0x6f05b59d3b20000', // 0.5 DSTN in wei
          // 코어에서 비율만 반환 (배수)
          collateralRatio: '0x4db', // 1243 (1243배)
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getPosition('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      // 비율은 그대로 디코딩
      expect(result.collateralRatio).toBe('1243');
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

      expect(result.collateralAmount).toBe('0.0');
      expect(result.collateralAmountWei).toBe('0');
      expect(result.debtAmount).toBe('0.0');
      expect(result.debtAmountWei).toBe('0');
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

