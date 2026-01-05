import { Test, TestingModule } from '@nestjs/testing';
import { CommonResponseDto } from '../../../apps/api/src/common/dto';
import { StakingController } from '../../../apps/api/src/staking/staking.controller';
import { StakingService } from '../../../apps/api/src/staking/staking.service';
import {
  StakingStatsResponseDto,
  TransactionResultResponseDto,
  ValidatorInfoResponseDto,
  ValidatorsResponseDto,
} from '../../../apps/api/src/staking/dto/staking.dto';

describe('StakingController', () => {
  let controller: StakingController;
  let service: jest.Mocked<StakingService>;

  beforeEach(async () => {
    const mockService = {
      deposit: jest.fn(),
      setWithdrawalAddress: jest.fn(),
      requestWithdrawal: jest.fn(),
      getValidator: jest.fn(),
      getValidators: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StakingController],
      providers: [
        {
          provide: StakingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<StakingController>(StakingController);
    service = module.get(StakingService);
  });

  describe('deposit', () => {
    it('should call service and return CommonResponseDto with TransactionResultResponseDto', async () => {
      const mockResponse: TransactionResultResponseDto = {
        hash: '0xtxhash123',
        status: 'confirmed',
        blockNumber: '12345',
        blockHash: '0xblockhash123',
      };
      service.deposit.mockResolvedValue(mockResponse);

      const result = await controller.deposit({
        privateKey: '0xprivatekey',
        amount: '32',
      });

      expect(service.deposit).toHaveBeenCalledWith('0xprivatekey', '32');
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('스테이킹 예치 성공');
    });
  });

  describe('setWithdrawalAddress', () => {
    it('should call service and return CommonResponseDto with TransactionResultResponseDto', async () => {
      const mockResponse: TransactionResultResponseDto = {
        hash: '0xtxhash456',
        status: 'confirmed',
        blockNumber: '12346',
        blockHash: '0xblockhash456',
      };
      service.setWithdrawalAddress.mockResolvedValue(mockResponse);

      const result = await controller.setWithdrawalAddress({
        privateKey: '0xprivatekey',
        withdrawalAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      });

      expect(service.setWithdrawalAddress).toHaveBeenCalledWith(
        '0xprivatekey',
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('출금 주소 설정 성공');
    });
  });

  describe('requestWithdrawal', () => {
    it('should call service and return CommonResponseDto with TransactionResultResponseDto', async () => {
      const mockResponse: TransactionResultResponseDto = {
        hash: '0xtxhash789',
        status: 'confirmed',
        blockNumber: '12347',
        blockHash: '0xblockhash789',
      };
      service.requestWithdrawal.mockResolvedValue(mockResponse);

      const result = await controller.requestWithdrawal({
        privateKey: '0xprivatekey',
      });

      expect(service.requestWithdrawal).toHaveBeenCalledWith('0xprivatekey');
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('출금 요청 성공');
    });
  });

  describe('getValidator', () => {
    it('should call service and return CommonResponseDto with ValidatorInfoResponseDto', async () => {
      const mockResponse: ValidatorInfoResponseDto = {
        validatorAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
        stakedAmount: '32.0',
        stakedAmountWei: '32000000000000000000',
        status: 'active_ongoing',
        withdrawalAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
        activatedAt: '1672531200',
        exitRequestedAt: '0',
        totalRewards: '0.5',
        totalRewardsWei: '500000000000000000',
        slashedAmount: '0.0',
        slashedAmountWei: '0',
      };
      service.getValidator.mockResolvedValue(mockResponse);

      const result = await controller.getValidator('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(service.getValidator).toHaveBeenCalledWith(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('Validator 정보 조회 성공');
    });
  });

  describe('getValidators', () => {
    it('should call service and return CommonResponseDto with ValidatorsResponseDto', async () => {
      const mockResponse: ValidatorsResponseDto = {
        validators: [
          {
            validatorAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
            stakedAmount: '32.0',
            stakedAmountWei: '32000000000000000000',
            status: 'active_ongoing',
            withdrawalAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
            activatedAt: '1672531200',
            exitRequestedAt: '0',
            totalRewards: '0.5',
            totalRewardsWei: '500000000000000000',
            slashedAmount: '0.0',
            slashedAmountWei: '0',
          },
        ],
        total: 1,
      };
      service.getValidators.mockResolvedValue(mockResponse);

      const result = await controller.getValidators();

      expect(service.getValidators).toHaveBeenCalled();
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('Validator 목록 조회 성공');
    });
  });

  describe('getStats', () => {
    it('should call service and return CommonResponseDto with StakingStatsResponseDto', async () => {
      const mockResponse: StakingStatsResponseDto = {
        totalStaked: '10000.0',
        totalStakedWei: '10000000000000000000000',
        totalValidators: 10,
        activeValidators: 8,
        totalRewards: '32.0',
        totalRewardsWei: '32000000000000000000',
        totalSlashed: '0.0',
        totalSlashedWei: '0',
        minStake: '32.0',
        minStakeWei: '32000000000000000000',
        maxValidators: 100,
        withdrawalDelay: '60',
      };
      service.getStats.mockResolvedValue(mockResponse);

      const result = await controller.getStats();

      expect(service.getStats).toHaveBeenCalled();
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('스테이킹 통계 조회 성공');
    });
  });
});





