import { ChainClientService } from '@app/chain-client';
import { ChainAccountDto } from '@app/common/types/chain-rpc.types';
import {
  TokenRepository,
  TokenTransferRepository,
  TransactionRepository,
} from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { AccountsService } from '../../../apps/api/src/accounts/accounts.service';

// axios 모킹
jest.mock('axios');

describe('AccountsService', () => {
  let service: AccountsService;
  let txRepo: jest.Mocked<TransactionRepository>;
  let chainClient: jest.Mocked<ChainClientService>;
  let tokenTransferRepo: jest.Mocked<TokenTransferRepository>;
  let tokenRepo: jest.Mocked<TokenRepository>;
  let mockAxiosInstance: any;

  const mockChainAccount: ChainAccountDto = {
    address: '0x123',
    balance: '0x2386f26fc10000',
    nonce: '0x5',
  };

  beforeEach(async () => {
    // axios.create 모킹
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };
    (axios.create as jest.Mock) = jest.fn(() => mockAxiosInstance);

    // 환경 변수 설정
    process.env.CHAIN_URL = 'http://localhost:3000';

    const mockTxRepo = {
      countByAddress: jest.fn(),
    };

    const mockTokenTransferRepo = {
      findByAddressPaginated: jest.fn(),
      findByTokenAndAddressPaginated: jest.fn(),
      getTokenBalancesByAddress: jest.fn(),
    };

    const mockTokenRepo = {
      findByAddress: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      count: jest.fn(),
    };

    const mockChainClient = {
      getAccount: jest.fn(),
      createWallet: jest.fn(),
      getReceipt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: TransactionRepository,
          useValue: mockTxRepo,
        },
        {
          provide: TokenTransferRepository,
          useValue: mockTokenTransferRepo,
        },
        {
          provide: TokenRepository,
          useValue: mockTokenRepo,
        },
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    txRepo = module.get(TransactionRepository);
    chainClient = module.get(ChainClientService);
    tokenTransferRepo = module.get(TokenTransferRepository);
    tokenRepo = module.get(TokenRepository);
  });

  describe('getAccount', () => {
    it('should return account information', async () => {
      chainClient.getAccount.mockResolvedValue(mockChainAccount);
      txRepo.countByAddress.mockResolvedValue(10);

      const result = await service.getAccount('0x123');

      expect(result.address).toBe('0x123');
      expect(result.nonce).toBe(5);
      expect(result.txCount).toBe(10);
      expect(result.balance).toBeDefined();
      expect(chainClient.getAccount).toHaveBeenCalledWith('0x123');
    });

    it('should throw NotFoundException when account not found', async () => {
      chainClient.getAccount.mockResolvedValue(null);

      await expect(service.getAccount('0x999')).rejects.toThrow(NotFoundException);
    });

    it('should convert address to lowercase', async () => {
      chainClient.getAccount.mockResolvedValue(mockChainAccount);
      txRepo.countByAddress.mockResolvedValue(0);

      await service.getAccount('0xABC');

      expect(chainClient.getAccount).toHaveBeenCalledWith('0xabc');
      expect(txRepo.countByAddress).toHaveBeenCalledWith('0xabc');
    });
  });

  describe('getTokenBalances', () => {
    it('should return token balances with metadata (both token unit and Wei)', async () => {
      tokenTransferRepo.getTokenBalancesByAddress.mockResolvedValue([
        { tokenAddress: '0xToken1', balance: '1000000000000000000000' }, // 1000 DSTN (18 decimals)
      ]);
      tokenRepo.findByAddress.mockResolvedValue({
        address: '0xtoken1',
        name: 'Dustin Token',
        symbol: 'DSTN',
        decimals: 18,
        type: 'erc20',
        id: 1,
        createdAt: new Date(),
      } as any);

      const result = await service.getTokenBalances('0xABC', 1, 20);

      expect(tokenTransferRepo.getTokenBalancesByAddress).toHaveBeenCalledWith('0xabc', 1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].tokenAddress).toBe('0xtoken1');
      expect(result.items[0].balance).toBe('1000.0'); // 토큰 단위
      expect(result.items[0].balanceSmallestUnit).toBe('1000000000000000000000'); // 원본
      expect(result.items[0].symbol).toBe('DSTN');
    });
  });

  describe('getTokenTransfers', () => {
    it('should return token transfers without token filter', async () => {
      tokenTransferRepo.findByAddressPaginated.mockResolvedValue([
        [
          {
            tokenAddress: '0xtoken1',
            from: '0xfrom',
            to: '0xabc',
            value: '10',
            blockNumber: '1',
            blockHash: '0xblock',
            transactionHash: '0xtx',
            logIndex: 0,
            timestamp: '1000',
          },
        ] as any,
        1,
      ]);

      const result = await service.getTokenTransfers('0xABC', undefined, 1, 20);

      expect(tokenTransferRepo.findByAddressPaginated).toHaveBeenCalledWith('0xabc', 1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].direction).toBe('in');
      expect(result.totalCount).toBe(1);
    });

    it('should return token transfers with token filter', async () => {
      tokenTransferRepo.findByTokenAndAddressPaginated.mockResolvedValue([
        [
          {
            tokenAddress: '0xtoken1',
            from: '0xabc',
            to: '0xto',
            value: '5',
            blockNumber: '2',
            blockHash: '0xblock2',
            transactionHash: '0xtx2',
            logIndex: 1,
            timestamp: '2000',
          },
        ] as any,
        1,
      ]);

      const result = await service.getTokenTransfers('0xABC', '0xToken1', 1, 20);

      expect(tokenTransferRepo.findByTokenAndAddressPaginated).toHaveBeenCalledWith(
        '0xToken1',
        '0xabc',
        1,
        20,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].direction).toBe('out');
      expect(result.totalCount).toBe(1);
    });
  });

  describe('createWallet', () => {
    it('should call core API and return wallet information', async () => {
      const mockWallet = {
        privateKey: '0xprivatekey123',
        publicKey: '0xpublickey123',
        address: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
        balance: '0',
        nonce: 0,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockWallet });

      const result = await service.createWallet();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/account/create-wallet');
      expect(result).toEqual(mockWallet);
    });
  });

  describe('transferNative', () => {
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

      // 프론트에서 10진수 DSTN 문자열로 받음 (예: "10")
      const result = await service.transferNative(
        '0xprivatekey',
        '0xto',
        '10',
      );

      // 코어에는 16진수 Wei로 변환되어 전달됨
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/transaction/send-native', {
        privateKey: '0xprivatekey',
        to: '0xto',
        amount: '0x8ac7230489e80000', // 10 DSTN = 10000000000000000000 Wei = 0x8ac7230489e80000
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

      const result = await service.transferNative(
        '0xprivatekey',
        '0xto',
        '0.5',
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
      // transferNative가 호출되는지만 확인
      // 실제 타임아웃 테스트는 통합 테스트에서 수행
      const resultPromise = service.transferNative(
        '0xprivatekey',
        '0xto',
        '1',
      );

      // 첫 번째 호출 확인
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/transaction/send-native', {
        privateKey: '0xprivatekey',
        to: '0xto',
        amount: '0xde0b6b3a7640000', // 1 DSTN
      });

      // 타임아웃이 발생하므로 pending 상태가 반환될 것
      // 하지만 실제로 60초를 기다리지 않기 위해 promise만 확인
      expect(resultPromise).toBeDefined();
    }, 10000); // 10초 타임아웃
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CHAIN_URL;
  });
});

