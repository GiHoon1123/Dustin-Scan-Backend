import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from '../../../apps/api/src/accounts/accounts.controller';
import { AccountsService } from '../../../apps/api/src/accounts/accounts.service';
import { AccountResponseDto } from '../../../apps/api/src/accounts/dto/account-response.dto';
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
});

