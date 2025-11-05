import { ChainClientService } from '@app/chain-client';
import { ChainAccountDto } from '@app/common/types/chain-rpc.types';
import { TransactionRepository } from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from '../../../apps/api/src/accounts/accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let txRepo: jest.Mocked<TransactionRepository>;
  let chainClient: jest.Mocked<ChainClientService>;

  const mockChainAccount: ChainAccountDto = {
    address: '0x123',
    balance: '0x2386f26fc10000',
    nonce: '0x5',
  };

  beforeEach(async () => {
    const mockTxRepo = {
      countByAddress: jest.fn(),
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
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    txRepo = module.get(TransactionRepository);
    chainClient = module.get(ChainClientService);
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
});

