import { BlocksModule } from '../../../../apps/api/src/blocks/blocks.module';

describe('BlocksModule', () => {
  it('should be defined', () => {
    expect(BlocksModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof BlocksModule).toBe('function');
  });
});

