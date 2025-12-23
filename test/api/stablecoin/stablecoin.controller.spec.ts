import { Test, TestingModule } from '@nestjs/testing';
import { CommonResponseDto } from '../../../apps/api/src/common/dto';
import { StablecoinController } from '../../../apps/api/src/stablecoin/stablecoin.controller';
import { StablecoinService } from '../../../apps/api/src/stablecoin/stablecoin.service';
import { TransactionResultResponseDto } from '../../../apps/api/src/stablecoin/dto/stablecoin.dto';

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
      getStablecoinBalance: jest.fn(),
      transferStablecoin: jest.fn(),
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
    it('should call service and return transaction response', async () => {
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
      expect(result).toEqual(mockResponse);
    });
  });

  describe('mintStablecoin', () => {
    it('should call service and return transaction response', async () => {
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
      expect(result).toEqual(mockResponse);
    });
  });

  describe('redeemStablecoin', () => {
    it('should call service and return transaction response', async () => {
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
      expect(result).toEqual(mockResponse);
    });
  });

  describe('withdrawCollateral', () => {
    it('should call service and return transaction response', async () => {
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
      expect(result).toEqual(mockResponse);
    });
  });

  describe('liquidate', () => {
    it('should call service and return transaction response', async () => {
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
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPosition', () => {
    it('should call service and return decoded position', async () => {
      const mockPosition = {
        collateralAmount: '1.0',
        collateralAmountWei: '1000000000000000000',
        debtAmount: '0.5',
        debtAmountWei: '500000000000000000',
        collateralRatio: '2000000000000000000',
      };
      service.getPosition.mockResolvedValue(mockPosition);

      const result = await controller.getPosition('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(service.getPosition).toHaveBeenCalledWith(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
      expect(result).toEqual(mockPosition);
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
      expect(result.data).toEqual(mockHealth);
      expect(result.message).toBe('헬스체크 확인 성공');
    });
  });

  describe('getStablecoinBalance', () => {
    it('should return balance wrapped in CommonResponseDto', async () => {
      const mockBalance = {
        balance: '100.0',
        balanceWei: '100000000000000000000',
      };
      service.getStablecoinBalance.mockResolvedValue(mockBalance);

      const result = await controller.getStablecoinBalance('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockBalance);
      expect(result.message).toBe('스테이블코인 잔액 조회 성공');
      expect(service.getStablecoinBalance).toHaveBeenCalledWith(
        '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
      );
    });
  });

  describe('transferStablecoin', () => {
    it('should return transaction result wrapped in CommonResponseDto', async () => {
      const mockResult: TransactionResultResponseDto = {
        hash: '0xtxhash123',
        status: 'confirmed',
        blockNumber: '12345',
        blockHash: '0xblockhash123',
      };
      service.transferStablecoin.mockResolvedValue(mockResult);

      const result = await controller.transferStablecoin({
        privateKey: '0xprivatekey',
        to: '0xto',
        amount: '100',
      });

      expect(result).toBeInstanceOf(CommonResponseDto);
      expect(result.data).toEqual(mockResult);
      expect(result.message).toBe('스테이블코인 전송 성공');
      expect(service.transferStablecoin).toHaveBeenCalledWith('0xprivatekey', '0xto', '100');
    });
  });
});

