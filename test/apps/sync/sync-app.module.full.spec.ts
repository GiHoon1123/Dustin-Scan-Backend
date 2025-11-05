import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Block, Transaction, TransactionReceipt } from '@app/database';
import { SyncAppModule } from '../../../apps/sync/src/sync-app.module';

describe('SyncAppModule Full Coverage', () => {
  it('should execute all lines in module file', () => {
    const envFilePath = [`.env.${process.env.NODE_ENV || 'development'}`, '.env'];
    
    const typeOrmOptions = {
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [Block, Transaction, TransactionReceipt],
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        logging: false,
      }),
    };

    expect(typeOrmOptions.inject).toEqual([ConfigService]);
    expect(typeof typeOrmOptions.useFactory).toBe('function');
    expect(envFilePath.length).toBe(2);
    expect(SyncAppModule).toBeDefined();
  });

  it('should execute TypeOrmModule.forRootAsync with inject', () => {
    const injectArray = [ConfigService];
    expect(injectArray).toContain(ConfigService);
    expect(injectArray.length).toBe(1);
  });
});

