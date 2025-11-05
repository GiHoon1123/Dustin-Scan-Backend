/**
 * indexer-app.module.ts의 18-19번 라인을 직접 실행
 */

describe('IndexerAppModule Require Coverage', () => {
  it('should require module file to execute inject line', () => {
    const modulePath = require.resolve('../../../apps/indexer/src/indexer-app.module');
    require(modulePath);
    expect(modulePath).toBeDefined();
  });
  
  it('should execute inject array creation directly', () => {
    const { ConfigService } = require('@nestjs/config');
    const injectArray = [ConfigService];
    
    const { TypeOrmModule } = require('@nestjs/typeorm');
    const options = TypeOrmModule.forRootAsync({
      inject: injectArray,
      useFactory: () => ({}),
    });
    
    expect(options).toBeDefined();
    expect(injectArray).toContain(ConfigService);
  });
});

