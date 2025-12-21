import {
  hexToBigInt,
  hexToBoolean,
  hexToAddress,
  decodeMultipleUint256,
} from '../../../../shared/common/utils/abi-decoder.util';

describe('ABI Decoder Utils', () => {
  describe('hexToBigInt', () => {
    it('should convert hex string to BigInt', () => {
      expect(hexToBigInt('0x1')).toBe(1n);
      expect(hexToBigInt('0xff')).toBe(255n);
      expect(hexToBigInt('0x100')).toBe(256n);
      expect(hexToBigInt('0x2386f26fc10000')).toBe(10000000000000000n);
    });

    it('should handle empty or zero hex strings', () => {
      expect(hexToBigInt('0x')).toBe(0n);
      expect(hexToBigInt('0x0')).toBe(0n);
      expect(hexToBigInt('')).toBe(0n);
    });

    it('should handle hex without 0x prefix', () => {
      expect(hexToBigInt('ff')).toBe(255n);
      expect(hexToBigInt('100')).toBe(256n);
    });
  });

  describe('hexToBoolean', () => {
    it('should convert non-zero hex to true', () => {
      expect(hexToBoolean('0x1')).toBe(true);
      expect(hexToBoolean('0xff')).toBe(true);
      expect(hexToBoolean('0x100')).toBe(true);
    });

    it('should convert zero hex to false', () => {
      expect(hexToBoolean('0x0')).toBe(false);
      expect(hexToBoolean('0x')).toBe(false);
      expect(hexToBoolean('')).toBe(false);
    });
  });

  describe('hexToAddress', () => {
    it('should extract address from hex string (last 20 bytes)', () => {
      // 32-byte hex string with address at the end
      const hex32Bytes = '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0';
      expect(hexToAddress(hex32Bytes)).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');
    });

    it('should handle address that is already 20 bytes', () => {
      const address = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
      expect(hexToAddress(address)).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');
    });

    it('should return zero address for empty or zero hex', () => {
      expect(hexToAddress('0x0')).toBe('0x0000000000000000000000000000000000000000');
      expect(hexToAddress('0x')).toBe('0x0000000000000000000000000000000000000000');
      expect(hexToAddress('')).toBe('0x0000000000000000000000000000000000000000');
    });

    it('should handle hex without 0x prefix', () => {
      const hex = '742d35cc6634c0532925a3b844bc9e7595f0beb0';
      expect(hexToAddress(hex)).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0');
    });

    it('should pad short addresses to 40 hex characters', () => {
      const shortHex = '0x123';
      const result = hexToAddress(shortHex);
      expect(result).toBe('0x0000000000000000000000000000000000000123');
      expect(result.length).toBe(42); // 0x + 40 chars
    });
  });

  describe('decodeMultipleUint256', () => {
    it('should decode multiple uint256 values from hex string', () => {
      // 3개의 uint256 값: 각각 32바이트 (64 hex chars)
      // 값1: 0x1 (1)
      // 값2: 0x64 (100)
      // 값3: 0x3e8 (1000)
      const hex =
        '0x0000000000000000000000000000000000000000000000000000000000000001' + // 1
        '0000000000000000000000000000000000000000000000000000000000000064' + // 100
        '00000000000000000000000000000000000000000000000000000000000003e8'; // 1000

      const result = decodeMultipleUint256(hex, 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('1');
      expect(result[1]).toBe('100');
      expect(result[2]).toBe('1000');
    });

    it('should decode position data (collateralAmount, debtAmount, collateralRatio)', () => {
      // 포지션 데이터 예시
      const collateralAmount = '1000000000000000000'; // 1 DSTN in wei
      const debtAmount = '500000000000000000'; // 0.5 DSTN in wei
      const collateralRatio = '2000000000000000000'; // 200% (2.0 * 10^18)

      const hex =
        '0x' +
        BigInt(collateralAmount).toString(16).padStart(64, '0') +
        BigInt(debtAmount).toString(16).padStart(64, '0') +
        BigInt(collateralRatio).toString(16).padStart(64, '0');

      const result = decodeMultipleUint256(hex, 3);
      expect(result[0]).toBe(collateralAmount);
      expect(result[1]).toBe(debtAmount);
      expect(result[2]).toBe(collateralRatio);
    });

    it('should handle hex without 0x prefix', () => {
      const hex =
        '0000000000000000000000000000000000000000000000000000000000000001' +
        '0000000000000000000000000000000000000000000000000000000000000064';

      const result = decodeMultipleUint256(hex, 2);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('1');
      expect(result[1]).toBe('100');
    });

    it('should handle single uint256 value', () => {
      const hex = '0x00000000000000000000000000000000000000000000000000000000000000ff';
      const result = decodeMultipleUint256(hex, 1);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('255');
    });
  });
});

