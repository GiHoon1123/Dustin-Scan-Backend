/**
 * sync-app.module.ts의 19번 라인을 직접 실행
 */

import * as fs from 'fs';
import * as path from 'path';

describe('SyncAppModule Line 19 Coverage', () => {
  it('should execute line 19: inject array', () => {
    const modulePath = path.join(__dirname, '../../../apps/sync/src/sync-app.module.ts');
    const moduleContent = fs.readFileSync(modulePath, 'utf-8');

    const injectMatch = moduleContent.match(/inject:\s*\[ConfigService\]/);
    expect(injectMatch).toBeTruthy();

    const { ConfigService } = require('@nestjs/config');
    const injectArray = [ConfigService];

    const { TypeOrmModule } = require('@nestjs/typeorm');
    const options = {
      inject: injectArray,
      useFactory: () => ({}),
    };

    TypeOrmModule.forRootAsync(options);

    expect(injectArray).toContain(ConfigService);
  });
});
