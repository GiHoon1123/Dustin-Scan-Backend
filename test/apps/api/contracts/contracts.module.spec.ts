import { ContractsModule } from '../../../../apps/api/src/contracts/contracts.module';

describe('ContractsModule', () => {
  it('should be defined', () => {
    expect(ContractsModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof ContractsModule).toBe('function');
  });
});

