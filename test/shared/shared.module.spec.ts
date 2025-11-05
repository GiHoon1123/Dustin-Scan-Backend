import { SharedModule } from '../../shared/shared.module';

describe('SharedModule', () => {
  it('should be defined', () => {
    expect(SharedModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof SharedModule).toBe('function');
  });
});

