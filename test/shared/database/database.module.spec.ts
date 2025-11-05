import { DatabaseModule } from '../../../shared/database/database.module';

describe('DatabaseModule', () => {
  it('should be defined', () => {
    expect(DatabaseModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof DatabaseModule).toBe('function');
  });
});

