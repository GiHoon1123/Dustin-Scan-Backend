import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from '../../../apps/api/src/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbIndicator: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn().mockResolvedValue({ status: 'ok', info: { database: { status: 'up' } } }),
    } as unknown as jest.Mocked<HealthCheckService>;

    dbIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    } as unknown as jest.Mocked<TypeOrmHealthIndicator>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: dbIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await controller.check();

      expect(result).toBeDefined();
      expect(healthCheckService.check).toHaveBeenCalled();
      // healthCheckService.check 내부에서 pingCheck가 호출됨
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });
  });
});

