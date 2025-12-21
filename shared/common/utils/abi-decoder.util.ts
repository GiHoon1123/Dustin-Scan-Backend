/**
 * ABI 디코딩 유틸리티
 *
 * 컨트랙트 호출 결과(hex string)를 디코딩하여 실제 값으로 변환
 */

/**
 * Hex string을 BigInt로 변환
 *
 * @param hex - 0x로 시작하는 hex string
 * @returns BigInt 값
 */
export function hexToBigInt(hex: string): bigint {
  if (!hex || hex === '0x' || hex === '0x0') {
    return 0n;
  }

  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  return BigInt('0x' + normalized);
}

/**
 * Hex string을 boolean으로 변환
 *
 * @param hex - 0x로 시작하는 hex string (uint256)
 * @returns boolean
 */
export function hexToBoolean(hex: string): boolean {
  if (!hex || hex === '0x' || hex === '0x0') {
    return false;
  }
  const value = hexToBigInt(hex);
  return value !== 0n;
}

/**
 * Hex string을 address로 변환 (마지막 20바이트)
 *
 * @param hex - 0x로 시작하는 hex string
 * @returns address (0x + 40 hex chars)
 */
export function hexToAddress(hex: string): string {
  if (!hex || hex === '0x' || hex === '0x0') {
    return '0x0000000000000000000000000000000000000000';
  }

  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  // 마지막 40자리 (20바이트)를 주소로 사용
  const addressPart = normalized.slice(-40).padStart(40, '0');
  return '0x' + addressPart.toLowerCase();
}

/**
 * 여러 개의 uint256 값을 디코딩 (각 32바이트씩)
 *
 * @param hex - 0x로 시작하는 hex string (여러 개의 32바이트 값)
 * @param count - 디코딩할 값의 개수
 * @returns decimal string 배열
 */
export function decodeMultipleUint256(hex: string, count: number): string[] {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const start = i * 64; // 각 32바이트 = 64 hex chars
    const end = start + 64;
    const valueHex = '0x' + normalized.slice(start, end);
    results.push(hexToBigInt(valueHex).toString());
  }

  return results;
}

