import { SyncAppModule } from '../../../apps/sync/src/sync-app.module';

describe('SyncAppModule', () => {
  it('should be defined', () => {
    expect(SyncAppModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof SyncAppModule).toBe('function');
  });
});

