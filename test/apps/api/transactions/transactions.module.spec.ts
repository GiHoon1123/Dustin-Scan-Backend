import { TransactionsModule } from '../../../../apps/api/src/transactions/transactions.module';

describe('TransactionsModule', () => {
  it('should be defined', () => {
    expect(TransactionsModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof TransactionsModule).toBe('function');
  });
});

