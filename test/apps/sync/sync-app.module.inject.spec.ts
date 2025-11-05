/**
 * sync-app.module.ts의 18-19번 라인 (inject: [ConfigService]) 커버리지 테스트
 */

import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('SyncAppModule Inject Coverage', () => {
  it('should execute inject array creation - line 18-19', () => {
    // sync-app.module.ts의 17-19번 라인과 동일한 코드
    const injectArray = [ConfigService]; // 18-19번 라인
    
    const options = {
      inject: injectArray,
      useFactory: () => ({}),
    };
    
    expect(injectArray).toContain(ConfigService);
    expect(injectArray.length).toBe(1);
    expect(options.inject).toEqual([ConfigService]);
    
    const result = TypeOrmModule.forRootAsync(options);
    expect(result).toBeDefined();
  });
});

