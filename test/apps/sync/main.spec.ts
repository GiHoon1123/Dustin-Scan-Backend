import { NestFactory } from '@nestjs/core';

jest.mock('@nestjs/core');
jest.mock('../../../apps/sync/src/sync-app.module', () => ({}), { virtual: true });
jest.spyOn(console, 'log').mockImplementation();

describe('Sync Main', () => {
  let mockApp: any;
  let bootstrap: () => Promise<void>;

  beforeEach(async () => {
    mockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    const mainModule = await import('../../../apps/sync/src/main');
    bootstrap = mainModule.bootstrap;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should bootstrap Sync application', async () => {
    const originalEnv = process.env.SYNC_PORT;
    process.env.SYNC_PORT = '4002';

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith('4002');

    process.env.SYNC_PORT = originalEnv;
  });

  it('should use default port when SYNC_PORT is not set', async () => {
    const originalEnv = process.env.SYNC_PORT;
    delete process.env.SYNC_PORT;

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(4002);

    process.env.SYNC_PORT = originalEnv;
  });
});
