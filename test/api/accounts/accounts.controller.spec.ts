import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from '../../../apps/api/src/accounts/accounts.controller';
import { AccountsService } from '../../../apps/api/src/accounts/accounts.service';
import { AccountResponseDto } from '../../../apps/api/src/accounts/dto/account-response.dto';
import { TokenBalanceDto } from '../../../apps/api/src/accounts/dto/token-balance.dto';
import { TokenTransferItemDto } from '../../../apps/api/src/accounts/dto/token-transfer-item.dto';
import { CommonResponseDto } from '../../../apps/api/src/common/dto';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: jest.Mocked<AccountsService>;

  const mockAccount: AccountResponseDto = {
    address: '0x123',
    balance: '1.0',
    balanceWei: '1000000000000000000',
    nonce: 5,
    txCount: 10,
  };

  beforeEach(async () => {
    const mockService = {
      getAccount: jest.fn(),
      getTokenBalances: jest.fn(),
      getTokenTransfers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get(AccountsService);
  });

  describe('getAccount', () => {
    it('should return account information', async () => {
      service.getAccount.mockResolvedValue(mockAccount);

      const result = await controller.getAccount('0x123');

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.address).toBe('0x123');
      expect(result.data.balance).toBe('1.0');
      expect(service.getAccount).toHaveBeenCalledWith('0x123');
    });
  });

  describe('getTokenBalances', () => {
    it('should return token balances', async () => {
      const items: TokenBalanceDto[] = [
        {
          tokenAddress: '0xtoken1',
          name: 'Dustin Token',
          symbol: 'DSTN',
          decimals: 18,
          balance: '1000',
        },
      ];
      service.getTokenBalances.mockResolvedValue({ items });

      const result = await controller.getTokenBalances('0x123', 1 as any, 20 as any);

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].tokenAddress).toBe('0xtoken1');
      expect(service.getTokenBalances).toHaveBeenCalled();
    });
  });

  describe('getTokenTransfers', () => {
    it('should return token transfers', async () => {
      const items: TokenTransferItemDto[] = [
        {
          tokenAddress: '0xtoken1',
          from: '0xfrom',
          to: '0x123',
          value: '10',
          blockNumber: '1',
          transactionHash: '0xtx',
          logIndex: 0,
          timestamp: '1000',
          direction: 'in',
        },
      ];
      service.getTokenTransfers.mockResolvedValue({ items, totalCount: 1 });

      const result = await controller.getTokenTransfers('0x123', undefined, 1 as any, 20 as any);

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.totalCount).toBe(1);
      expect(service.getTokenTransfers).toHaveBeenCalled();
    });
  });
});
