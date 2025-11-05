import { dstnToWei, formatDstn, weiToDstn } from '../../../../shared/common/utils/dstn-converter';

describe('dstn-converter', () => {
  describe('weiToDstn', () => {
    it('should convert wei to DSTN', () => {
      expect(weiToDstn('1000000000000000000')).toBe('1.0');
      expect(weiToDstn('500000000000000000')).toBe('0.5');
      expect(weiToDstn('1234567890000000000')).toBe('1.2345');
    });

    it('should handle bigint input', () => {
      expect(weiToDstn(BigInt('1000000000000000000'))).toBe('1.0');
    });

    it('should handle zero remainder', () => {
      expect(weiToDstn('2000000000000000000')).toBe('2.0');
    });

    it('should use custom decimals', () => {
      expect(weiToDstn('1234567890000000000', 2)).toBe('1.23');
      expect(weiToDstn('1234567890000000000', 6)).toBe('1.234567');
    });

    it('should handle zero wei', () => {
      expect(weiToDstn('0')).toBe('0.0');
      expect(weiToDstn(BigInt('0'))).toBe('0.0');
    });

    it('should handle very small amounts', () => {
      expect(weiToDstn('1000000000000000')).toBe('0.001');
    });

    it('should handle remainder that results in empty trimmedDecimal', () => {
      // remainder가 있지만 trimmedDecimal이 빈 문자열이 되는 경우
      // 예: remainder가 0으로 시작하는 경우
      expect(weiToDstn('1000000000000000000', 0)).toBe('1.0');
    });

    it('should handle bigint input with remainder', () => {
      const weiBigInt = BigInt('1500000000000000000');
      expect(weiToDstn(weiBigInt)).toBe('1.5');
    });
  });

  describe('dstnToWei', () => {
    it('should convert DSTN to wei', () => {
      expect(dstnToWei('1')).toBe('1000000000000000000');
      expect(dstnToWei('0.5')).toBe('500000000000000000');
      expect(dstnToWei('1.5')).toBe('1500000000000000000');
    });

    it('should handle number input', () => {
      expect(dstnToWei(1)).toBe('1000000000000000000');
    });

    it('should handle zero', () => {
      expect(dstnToWei('0')).toBe('0');
      expect(dstnToWei(0)).toBe('0');
    });

    it('should handle integer without decimal', () => {
      expect(dstnToWei('5')).toBe('5000000000000000000');
    });

    it('should handle decimal with empty integer part', () => {
      expect(dstnToWei('.5')).toBe('500000000000000000');
    });

    it('should handle decimal with empty decimal part', () => {
      expect(dstnToWei('5.')).toBe('5000000000000000000');
    });

    it('should handle decimal with empty integer part (starts with dot)', () => {
      expect(dstnToWei('.5')).toBe('500000000000000000');
    });

    it('should handle number input with decimal', () => {
      expect(dstnToWei(1.5)).toBe('1500000000000000000');
    });
  });

  describe('formatDstn', () => {
    it('should format DSTN with unit', () => {
      expect(formatDstn('1000000000000000000')).toBe('1.0 DSTN');
      expect(formatDstn('1500000000000000000', 2)).toBe('1.5 DSTN');
    });
  });
});

