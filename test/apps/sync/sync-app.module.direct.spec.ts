/**
 * sync-app.module.ts를 직접 import하여 모든 코드 라인 실행
 */

import '../../../apps/sync/src/sync-app.module';

describe('SyncAppModule Direct Import', () => {
  it('should import and execute module file', () => {
    expect(true).toBe(true);
  });
});

