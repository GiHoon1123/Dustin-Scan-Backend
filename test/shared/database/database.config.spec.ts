import {
  databaseConfig,
  logDatabaseConfig,
  validateDatabaseEnv,
} from '../../../shared/database/database.config';

describe('database.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'root',
      DB_PASSWORD: '1234',
      DB_DATABASE: 'dustin_scan',
      DB_SYNCHRONIZE: 'false',
      DB_LOGGING: 'false',
      NODE_ENV: 'production',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('databaseConfig', () => {
    it('should create database config from environment variables', () => {
      // 환경 변수가 설정된 후 다시 로드
      const { databaseConfig: config } = require('../../../shared/database/database.config');
      expect(config.type).toBe('postgres');
      expect((config as any).host).toBe('localhost');
      expect((config as any).port).toBe(5432);
      expect((config as any).username).toBe('root');
      expect((config as any).password).toBe('1234');
      expect((config as any).database).toBe('dustin_scan');
      expect(config.synchronize).toBe(false);
      expect(config.logging).toBe(false);
    });

    it('should set synchronize to true when DB_SYNCHRONIZE is true', () => {
      process.env.DB_SYNCHRONIZE = 'true';
      const config = require('../../../shared/database/database.config').databaseConfig;
      expect(config.synchronize).toBe(true);
    });

    it('should set logging to true when DB_LOGGING is true', () => {
      process.env.DB_LOGGING = 'true';
      const config = require('../../../shared/database/database.config').databaseConfig;
      expect(config.logging).toBe(true);
    });

    it('should have connection pool settings', () => {
      const config = databaseConfig as any;
      expect(config.extra).toBeDefined();
      expect(config.extra.max).toBe(20);
      expect(config.extra.min).toBe(5);
    });
  });

  describe('validateDatabaseEnv', () => {
    it('should not throw when all required env vars are present', () => {
      expect(() => validateDatabaseEnv()).not.toThrow();
    });

    it('should throw when DB_HOST is missing', () => {
      delete process.env.DB_HOST;
      expect(() => validateDatabaseEnv()).toThrow('Missing required environment variables');
    });

    it('should throw when DB_PORT is missing', () => {
      delete process.env.DB_PORT;
      expect(() => validateDatabaseEnv()).toThrow('Missing required environment variables');
    });

    it('should throw when DB_USERNAME is missing', () => {
      delete process.env.DB_USERNAME;
      expect(() => validateDatabaseEnv()).toThrow('Missing required environment variables');
    });

    it('should throw when DB_PASSWORD is missing', () => {
      delete process.env.DB_PASSWORD;
      expect(() => validateDatabaseEnv()).toThrow('Missing required environment variables');
    });

    it('should throw when DB_DATABASE is missing', () => {
      delete process.env.DB_DATABASE;
      expect(() => validateDatabaseEnv()).toThrow('Missing required environment variables');
    });
  });

  describe('logDatabaseConfig', () => {
    it('should log database configuration', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logDatabaseConfig();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

