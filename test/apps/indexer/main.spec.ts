import { NestFactory } from '@nestjs/core';

jest.mock('@nestjs/core');
jest.mock('../../../apps/indexer/src/indexer-app.module', () => ({}), { virtual: true });
jest.spyOn(console, 'log').mockImplementation();

describe('Indexer Main', () => {
  let mockApp: any;
  let bootstrap: () => Promise<void>;

  beforeEach(async () => {
    mockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    const mainModule = await import('../../../apps/indexer/src/main');
    bootstrap = mainModule.bootstrap;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should bootstrap Indexer application', async () => {
    const originalEnv = process.env.INDEXER_PORT;
    process.env.INDEXER_PORT = '4001';

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith('4001');

    process.env.INDEXER_PORT = originalEnv;
  });

  it('should use default port when INDEXER_PORT is not set', async () => {
    const originalEnv = process.env.INDEXER_PORT;
    delete process.env.INDEXER_PORT;

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(4001);

    process.env.INDEXER_PORT = originalEnv;
  });
});
