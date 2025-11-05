import { AccountsModule } from '../../../../apps/api/src/accounts/accounts.module';

describe('AccountsModule', () => {
  it('should be defined', () => {
    expect(AccountsModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof AccountsModule).toBe('function');
  });
});

