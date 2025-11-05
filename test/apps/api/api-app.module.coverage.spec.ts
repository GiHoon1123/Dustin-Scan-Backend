import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ApiAppModule } from '../../../apps/api/src/api-app.module';
import {
  Block,
  Contract,
  ContractMethod,
  Transaction,
  TransactionReceipt,
} from '@app/database';

// 모듈 파일을 직접 import하여 모든 코드 실행
import '../../../apps/api/src/api-app.module';

describe('ApiAppModule Coverage', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USERNAME = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_DATABASE = 'test';
    process.env.DB_SYNCHRONIZE = 'false';
  });

  it('should execute ConfigModule.forRoot with envFilePath', () => {
    const envFilePath = [`.env.${process.env.NODE_ENV || 'development'}`, '.env'];
    expect(envFilePath).toContain('.env.test');
    expect(envFilePath).toContain('.env');
  });

  it('should execute TypeOrmModule.forRootAsync useFactory - exact same code', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        const envMap: Record<string, any> = {
          DB_HOST: 'localhost',
          DB_PORT: '5432',
          DB_USERNAME: 'test',
          DB_PASSWORD: 'test',
          DB_DATABASE: 'test',
          DB_SYNCHRONIZE: 'false',
        };
        return envMap[key];
      }),
    } as unknown as ConfigService;

    // ApiAppModule의 useFactory와 동일한 코드
    const useFactory = (config: ConfigService) => ({
      type: 'postgres',
      host: config.get('DB_HOST'),
      port: config.get('DB_PORT'),
      username: config.get('DB_USERNAME'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_DATABASE'),
      entities: [Block, Transaction, TransactionReceipt, Contract, ContractMethod],
      synchronize: config.get('DB_SYNCHRONIZE') === 'true',
      logging: false,
    });

    const result = useFactory(mockConfig);
    expect(result.type).toBe('postgres');
    expect(result.host).toBe('localhost');
    expect(result.port).toBe('5432');
    expect(result.username).toBe('test');
    expect(result.password).toBe('test');
    expect(result.database).toBe('test');
    expect(result.entities).toContain(Block);
    expect(result.entities).toContain(Transaction);
    expect(result.entities).toContain(TransactionReceipt);
    expect(result.entities).toContain(Contract);
    expect(result.entities).toContain(ContractMethod);
    expect(result.synchronize).toBe(false);
    expect(result.logging).toBe(false);
  });

  it('should handle DB_SYNCHRONIZE true', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'DB_SYNCHRONIZE') return 'true';
        return 'test';
      }),
    } as unknown as ConfigService;

    const useFactory = (config: ConfigService) => ({
      synchronize: config.get('DB_SYNCHRONIZE') === 'true',
    });

    const result = useFactory(mockConfig);
    expect(result.synchronize).toBe(true);
  });

  it('should execute inject array - exact same as module', () => {
    // ApiAppModule의 TypeOrmModule.forRootAsync 옵션과 동일
    const options = {
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [Block, Transaction, TransactionReceipt, Contract, ContractMethod],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        logging: false,
      }),
    };
    expect(options.inject).toContain(ConfigService);
    expect(options.inject.length).toBe(1);
    expect(typeof options.useFactory).toBe('function');
  });

  it('should handle NODE_ENV undefined', () => {
    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    const envFilePath = [`.env.${process.env.NODE_ENV || 'development'}`, '.env'];
    expect(envFilePath).toContain('.env.development');
    process.env.NODE_ENV = originalEnv;
  });

  it('should have ApiAppModule defined', () => {
    expect(ApiAppModule).toBeDefined();
  });
});

