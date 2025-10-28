/**
 * Hex 문자열과 Decimal 숫자 간 변환 유틸리티
 *
 * Dustin-Chain API는 모든 숫자를 Hex String으로 반환하므로
 * DB 저장을 위해 Decimal로 변환이 필요함
 */

/**
 * Hex String을 Decimal Number로 변환
 *
 * @param hex - 0x로 시작하는 16진수 문자열 (예: "0x7b")
 * @returns Decimal 숫자 (예: 123)
 * @throws hex가 유효하지 않으면 에러
 */
export function hexToDecimal(hex: string): number {
  if (!hex || typeof hex !== 'string') {
    throw new Error(`Invalid hex string: ${hex}`);
  }

  // 0x 접두사 제거 후 10진수로 변환
  const decimal = parseInt(hex, 16);

  if (isNaN(decimal)) {
    throw new Error(`Failed to convert hex to decimal: ${hex}`);
  }

  return decimal;
}

/**
 * Hex String을 Decimal String으로 변환 (큰 숫자용)
 *
 * JavaScript의 Number는 2^53-1까지만 안전하므로
 * 큰 숫자(balance, value 등)는 BigInt를 사용하여 String으로 변환
 *
 * @param hex - 0x로 시작하는 16진수 문자열
 * @returns Decimal 문자열 (예: "1000000000000000000")
 */
export function hexToDecimalString(hex: string): string {
  if (!hex || typeof hex !== 'string') {
    throw new Error(`Invalid hex string: ${hex}`);
  }

  try {
    // BigInt를 사용하여 큰 숫자도 안전하게 변환
    return BigInt(hex).toString();
  } catch (error) {
    throw new Error(`Failed to convert hex to decimal string: ${hex}`);
  }
}

/**
 * Decimal Number를 Hex String으로 변환
 *
 * @param decimal - 10진수 숫자
 * @returns 0x 접두사가 붙은 16진수 문자열
 */
export function decimalToHex(decimal: number): string {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    throw new Error(`Invalid decimal number: ${decimal}`);
  }

  return '0x' + decimal.toString(16);
}

/**
 * Unix timestamp (Hex String)를 Date 객체로 변환
 *
 * @param hexTimestamp - Unix timestamp의 Hex String (예: "0x617e0f42")
 * @returns Date 객체
 */
export function hexTimestampToDate(hexTimestamp: string): Date {
  const timestamp = hexToDecimal(hexTimestamp);
  return new Date(timestamp * 1000); // Unix timestamp는 초 단위이므로 밀리초로 변환
}
