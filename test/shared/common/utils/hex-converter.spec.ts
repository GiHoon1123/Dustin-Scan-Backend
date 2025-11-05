import {
  decimalToHex,
  hexTimestampToDate,
  hexToDecimal,
  hexToDecimalString,
} from '../../../../shared/common/utils/hex-converter';

describe('hex-converter', () => {
  describe('hexToDecimal', () => {
    it('should convert hex to decimal', () => {
      expect(hexToDecimal('0x7b')).toBe(123);
      expect(hexToDecimal('0xff')).toBe(255);
      expect(hexToDecimal('0x0')).toBe(0);
    });

    it('should throw error for invalid hex', () => {
      expect(() => hexToDecimal('invalid')).toThrow();
      expect(() => hexToDecimal('')).toThrow();
      expect(() => hexToDecimal(null as any)).toThrow();
      expect(() => hexToDecimal(undefined as any)).toThrow();
      expect(() => hexToDecimal(123 as any)).toThrow();
    });

    it('should handle hex that results in NaN', () => {
      // parseInt가 NaN을 반환하는 경우
      expect(() => hexToDecimal('0xGG')).toThrow();
    });
  });

  describe('hexToDecimalString', () => {
    it('should convert hex to decimal string', () => {
      expect(hexToDecimalString('0x2386f26fc10000')).toBe('10000000000000000');
      expect(hexToDecimalString('0x0')).toBe('0');
      expect(hexToDecimalString('0xff')).toBe('255');
    });

    it('should throw error for invalid hex', () => {
      expect(() => hexToDecimalString('invalid')).toThrow();
      expect(() => hexToDecimalString('')).toThrow();
      expect(() => hexToDecimalString(null as any)).toThrow();
      expect(() => hexToDecimalString(undefined as any)).toThrow();
      expect(() => hexToDecimalString(123 as any)).toThrow();
    });

    it('should handle BigInt conversion error', () => {
      // BigInt가 실패하는 경우
      expect(() => hexToDecimalString('0xinvalid')).toThrow();
    });
  });

  describe('decimalToHex', () => {
    it('should convert decimal to hex', () => {
      expect(decimalToHex(123)).toBe('0x7b');
      expect(decimalToHex(255)).toBe('0xff');
      expect(decimalToHex(0)).toBe('0x0');
    });

    it('should throw error for invalid decimal', () => {
      expect(() => decimalToHex(NaN)).toThrow();
      expect(() => decimalToHex(null as any)).toThrow();
      expect(() => decimalToHex(undefined as any)).toThrow();
      expect(() => decimalToHex('123' as any)).toThrow();
    });
  });

  describe('hexTimestampToDate', () => {
    it('should convert hex timestamp to date', () => {
      const date = hexTimestampToDate('0x617e0f42');
      expect(date).toBeInstanceOf(Date);
    });
  });
});

