import { IndexerAppModule } from '../../../apps/indexer/src/indexer-app.module';

describe('IndexerAppModule', () => {
  it('should be defined', () => {
    expect(IndexerAppModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof IndexerAppModule).toBe('function');
  });
});

