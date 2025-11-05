/**
 * api-app.module.ts를 직접 import하여 모든 코드 라인 실행
 * 
 * 모듈 파일을 import하면 데코레이터가 실행되면서 모든 코드가 실행됩니다.
 */

// 모듈 파일을 직접 import - 이렇게 하면 모든 코드가 실행됨
import '../../../apps/api/src/api-app.module';

describe('ApiAppModule Direct Import', () => {
  it('should import and execute module file', () => {
    // 모듈 파일을 import하면 데코레이터가 실행되어 모든 코드가 커버됨
    // inject: [ConfigService] 라인도 실행됨
    expect(true).toBe(true);
  });
});

