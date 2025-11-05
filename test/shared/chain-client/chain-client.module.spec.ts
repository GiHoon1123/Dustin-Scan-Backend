import { ChainClientModule } from '../../../shared/chain-client/chain-client.module';

describe('ChainClientModule', () => {
  it('should be defined', () => {
    expect(ChainClientModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof ChainClientModule).toBe('function');
  });
});

