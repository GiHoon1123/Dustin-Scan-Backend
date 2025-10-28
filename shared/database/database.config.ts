import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Block } from './entities/block.entity';
import { Transaction } from './entities/transaction.entity';

/**
 * Database 설정
 *
 * 환경:
 * - Development: dustin_scan_dev (synchronize: true, logging: true)
 * - Production: dustin_scan (synchronize: false, logging: false)
 *
 * 연결 정보:
 * - Host: localhost (같은 서버)
 * - Port: 5432
 * - Username: root
 * - Password: 1234
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_DATABASE,
  entities: [Block, Transaction, Account],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',

  // Connection Pool 설정
  extra: {
    max: 20, // 최대 연결 수
    min: 5, // 최소 연결 수
    idleTimeoutMillis: 30000, // 30초
  },

  // Retry 설정
  retryAttempts: 3,
  retryDelay: 3000,
};

/**
 * 환경 변수 검증
 */
export const validateDatabaseEnv = (): void => {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Database 연결 정보 출력 (보안 정보 제외)
 */
export const logDatabaseConfig = () => {
  console.log('📊 Database Configuration:');
  console.log(`  - Environment: ${isDevelopment ? 'development' : 'production'}`);
  console.log(`  - Host: ${databaseConfig.host}`);
  console.log(`  - Port: ${databaseConfig.port}`);
  console.log(`  - Database: ${databaseConfig.database}`);
  console.log(`  - Username: ${databaseConfig.username}`);
  console.log(`  - Synchronize: ${databaseConfig.synchronize}`);
  console.log(`  - Logging: ${databaseConfig.logging}`);
};
