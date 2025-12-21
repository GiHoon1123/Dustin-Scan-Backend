import { Test, TestingModule } from '@nestjs/testing';
import { CommonResponseDto } from '../../../apps/api/src/common/dto';
import { StablecoinController } from '../../../apps/api/src/stablecoin/stablecoin.controller';
import { StablecoinService } from '../../../apps/api/src/stablecoin/stablecoin.service';

describe('StablecoinController', () => {
  let controller: StablecoinController;
  let service: jest.Mocked<StablecoinService>;

  beforeEach(async () => {
    const mockService = {
      depositCollateral: jest.fn(),
      mintStablecoin: jest.fn(),
      redeemStablecoin: jest.fn(),
      withdrawCollateral: jest.fn(),
      liquidate: jest.fn(),
      getPosition: jest.fn(),
      getHealth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StablecoinController],
      providers: [
        {
          provide: StablecoinService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<StablecoinController>(StablecoinController);
    service = module.get(StablecoinService);
  });

  describe('depositCollateral', () => {
    it('should call service and return transaction response wrapped in CommonResponseDto', async () => {
      const mockResponse = {
        hash: '0xtxhash123',
        status: 'pending',
      };
      service.depositCollateral.mockResolvedValue(mockResponse);

      const result = await controller.depositCollateral({
        privateKey: '0xprivatekey',
        amount: '1000000000000000000',
      });

      expect(service.depositCollateral).toHaveBeenCalledWith(
        '0xprivatekey',
        '1000000000000000000',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('담보 예치 성공');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('mintStablecoin', () => {
    it('should call service and return transaction response wrapped in CommonResponseDto', async () => {
      const mockResponse = {
        hash: '0xtxhash456',
        status: 'pending',
      };
      service.mintStablecoin.mockResolvedValue(mockResponse);

      const result = await controller.mintStablecoin({
        privateKey: '0xprivatekey',
        stablecoinAmount: '500000000000000000000',
      });

      expect(service.mintStablecoin).toHaveBeenCalledWith(
        '0xprivatekey',
        '500000000000000000000',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('스테이블코인 발행 성공');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('redeemStablecoin', () => {
    it('should call service and return transaction response wrapped in CommonResponseDto', async () => {
      const mockResponse = {
        hash: '0xtxhash789',
        status: 'pending',
      };
      service.redeemStablecoin.mockResolvedValue(mockResponse);

      const result = await controller.redeemStablecoin({
        privateKey: '0xprivatekey',
        stablecoinAmount: '200000000000000000000',
      });

      expect(service.redeemStablecoin).toHaveBeenCalledWith(
        '0xprivatekey',
        '200000000000000000000',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('스테이블코인 상환 성공');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('withdrawCollateral', () => {
    it('should call service and return transaction response wrapped in CommonResponseDto', async () => {
      const mockResponse = {
        hash: '0xtxhashabc',
        status: 'pending',
      };
      service.withdrawCollateral.mockResolvedValue(mockResponse);

      const result = await controller.withdrawCollateral({
        privateKey: '0xprivatekey',
        amount: '500000000000000000',
      });

      expect(service.withdrawCollateral).toHaveBeenCalledWith(
        '0xprivatekey',
        '500000000000000000',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('담보 인출 성공');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('liquidate', () => {
    it('should call service and return transaction response wrapped in CommonResponseDto', async () => {
      const mockResponse = {
        hash: '0xtxhashdef',
        status: 'pending',
      };
      service.liquidate.mockResolvedValue(mockResponse);

      const result = await controller.liquidate({
        privateKey: '0xprivatekey',
        userAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      });

      expect(service.liquidate).toHaveBeenCalledWith(
        '0xprivatekey',
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('청산 성공');
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getPosition', () => {
    it('should call service and return decoded position wrapped in CommonResponseDto', async () => {
      const mockPosition = {
        collateralAmount: '1000000000000000000',
        debtAmount: '500000000000000000',
        collateralRatio: '2000000000000000000',
      };
      service.getPosition.mockResolvedValue(mockPosition);

      const result = await controller.getPosition('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(service.getPosition).toHaveBeenCalledWith(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('포지션 조회 성공');
      expect(result.data).toEqual(mockPosition);
    });
  });

  describe('getHealth', () => {
    it('should call service and return decoded health status wrapped in CommonResponseDto', async () => {
      const mockHealth = {
        isHealthy: true,
      };
      service.getHealth.mockResolvedValue(mockHealth);

      const result = await controller.getHealth('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(service.getHealth).toHaveBeenCalledWith(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('건강도 확인 성공');
      expect(result.data).toEqual(mockHealth);
    });
  });
});

