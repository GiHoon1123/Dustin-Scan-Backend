import { ApiAppModule } from '../../../apps/api/src/api-app.module';

describe('ApiAppModule', () => {
  it('should be defined', () => {
    expect(ApiAppModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof ApiAppModule).toBe('function');
  });
});

