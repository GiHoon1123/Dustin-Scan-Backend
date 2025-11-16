import { ChainClientService } from '@app/chain-client';
import { ChainAccountDto } from '@app/common/types/chain-rpc.types';
import {
  TokenRepository,
  TokenTransferRepository,
  TransactionRepository,
} from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from '../../../apps/api/src/accounts/accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let txRepo: jest.Mocked<TransactionRepository>;
  let chainClient: jest.Mocked<ChainClientService>;
  let tokenTransferRepo: jest.Mocked<TokenTransferRepository>;
  let tokenRepo: jest.Mocked<TokenRepository>;

  const mockChainAccount: ChainAccountDto = {
    address: '0x123',
    balance: '0x2386f26fc10000',
    nonce: '0x5',
  };

  beforeEach(async () => {
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
    it('should return token balances with metadata', async () => {
      tokenTransferRepo.getTokenBalancesByAddress.mockResolvedValue([
        { tokenAddress: '0xToken1', balance: '1000' },
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
      expect(result.items[0].balance).toBe('1000');
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
});

