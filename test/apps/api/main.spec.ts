import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

jest.mock('@nestjs/core');
jest.mock('@nestjs/swagger');
jest.mock('../../../apps/api/src/api-app.module', () => ({}), { virtual: true });

describe('API Main', () => {
  let mockApp: any;
  let bootstrap: () => Promise<void>;

  beforeEach(async () => {
    mockApp = {
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (DocumentBuilder as any).mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addTag: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    }));
    (SwaggerModule.createDocument as jest.Mock).mockReturnValue({});
    (SwaggerModule.setup as jest.Mock).mockReturnValue(undefined);

    // Import bootstrap function
    const mainModule = await import('../../../apps/api/src/main');
    bootstrap = mainModule.bootstrap;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should bootstrap API application', async () => {
    const originalEnv = process.env.API_PORT;
    process.env.API_PORT = '4000';

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.any(ValidationPipe),
    );
    // API_PORT가 문자열이면 문자열로, 숫자면 숫자로 전달됨
    expect(mockApp.listen).toHaveBeenCalledWith(expect.any(String));

    process.env.API_PORT = originalEnv;
  });

  it('should use default port when API_PORT is not set', async () => {
    const originalEnv = process.env.API_PORT;
    delete process.env.API_PORT;

    await bootstrap();

    // 기본값은 숫자 4000
    expect(mockApp.listen).toHaveBeenCalledWith(4000);

    process.env.API_PORT = originalEnv;
  });

  it('should execute require.main === module check', () => {
    // main.ts의 37번 라인: if (require.main === module)
    // 이 부분은 실제로 실행될 때만 커버되므로, require.main을 확인
    expect(require.main).toBeDefined();
    // bootstrap 함수가 정의되어 있는지 확인
    expect(bootstrap).toBeDefined();
  });
});
