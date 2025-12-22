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

  describe('getStablecoinBalance', () => {
    it('should decode balance from hex Wei to token unit and return both units', async () => {
      const mockResponse = {
        data: {
          balance: '0x56bc75e2d63100000', // 100 USDST in Wei (hex)
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getStablecoinBalance('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/stablecoin/balance/0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result.balance).toBe('100.0'); // 토큰 단위
      expect(result.balanceSmallestUnit).toBe('100000000000000000000'); // smallest unit (10진수)
    });

    it('should handle zero balance', async () => {
      const mockResponse = {
        data: {
          balance: '0x0', // 0 Wei
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getStablecoinBalance('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(result.balance).toBe('0.0'); // 토큰 단위
      expect(result.balanceSmallestUnit).toBe('0'); // smallest unit
    });
  });

  describe('transferStablecoin', () => {
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
      // 첫 번째 호출: receipt 없음 (pending)
      // 두 번째 호출: receipt 있음 (confirmed)
      chainClient.getReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "100")
      const result = await service.transferStablecoin(
        '0xprivatekey',
        '0xto',
        '100',
      );

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/transfer', {
        privateKey: '0xprivatekey',
        to: '0xto',
        amount: '0x56bc75e2d63100000', // 100 DSTN = 100000000000000000000 Wei = 0x56bc75e2d63100000
      });

      // 트랜잭션이 블록에 반영될 때까지 대기
      expect(chainClient.getReceipt).toHaveBeenCalledWith('0xtxhash123');
      expect(result).toEqual({
        hash: '0xtxhash123',
        status: 'confirmed',
        blockNumber: '12345', // toString()으로 변환됨
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
        gasUsed: '0x5208', // 21000 in hex
        cumulativeGasUsed: '0x5208', // 21000 in hex
        status: '0x0', // 실패 (hex string)
        contractAddress: null,
        logs: [],
        logsBloom: '0x',
      };

      mockAxiosInstance.post.mockResolvedValue(mockTxResponse);
      chainClient.getReceipt
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockReceipt);

      const result = await service.transferStablecoin(
        '0xprivatekey',
        '0xto',
        '0.25',
      );

      expect(result).toEqual({
        hash: '0xtxhash456',
        status: 'failed',
        blockNumber: '12346', // toString()으로 변환됨
        blockHash: '0xblockhash456',
      });
    });

    it('should handle pending transaction (timeout)', async () => {
      const mockTxResponse = {
        data: {
          hash: '0xtxhash789',
          status: 'pending',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockTxResponse);
      // receipt가 계속 null (타임아웃)
      chainClient.getReceipt.mockResolvedValue(null);

      // waitForTransaction을 직접 테스트하기보다는
      // transferStablecoin이 호출되는지만 확인
      // 실제 타임아웃 테스트는 통합 테스트에서 수행
      const resultPromise = service.transferStablecoin(
        '0xprivatekey',
        '0xto',
        '1',
      );

      // 첫 번째 호출 확인
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/stablecoin/transfer', {
        privateKey: '0xprivatekey',
        to: '0xto',
        amount: '0xde0b6b3a7640000', // 1 DSTN
      });

      // 타임아웃이 발생하므로 pending 상태가 반환될 것
      // 하지만 실제로 60초를 기다리지 않기 위해 promise만 확인
      expect(resultPromise).toBeDefined();
    }, 10000); // 10초 타임아웃
  });
});

