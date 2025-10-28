/**
 * DSTN (Dustin Token) 단위 변환 유틸리티
 *
 * 단위 체계:
 * - 1 DSTN = 1,000,000,000,000,000,000 Wei (10^18)
 * - 이더리움 표준과 동일
 *
 * 용도:
 * - Wei ↔ DSTN 변환
 * - 블록 탐색기 UI에서 사용자에게 친화적인 형식으로 표시
 */

const WEI_PER_DSTN = BigInt(10 ** 18);

/**
 * Wei → DSTN 변환
 *
 * 사용 예시:
 * - weiToDstn("1000000000000000000") // "1.0"
 * - weiToDstn("500000000000000000") // "0.5"
 * - weiToDstn("1234567890000000000") // "1.23456789"
 *
 * @param wei - Wei 단위 금액 (string 또는 bigint)
 * @param decimals - 소수점 자리수 (기본값: 4)
 * @returns DSTN 단위의 문자열
 */
export function weiToDstn(wei: string | bigint, decimals: number = 4): string {
  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;

  // 정수 부분
  const integerPart = weiBigInt / WEI_PER_DSTN;

  // 소수 부분
  const remainder = weiBigInt % WEI_PER_DSTN;

  if (remainder === 0n) {
    return integerPart.toString() + '.0';
  }

  // 소수점 처리 (18자리 패딩)
  const decimalStr = remainder.toString().padStart(18, '0');

  // 지정된 자리수만큼만 표시하고 trailing zeros 제거
  const trimmedDecimal = decimalStr.slice(0, decimals).replace(/0+$/, '');

  if (trimmedDecimal === '') {
    return integerPart.toString() + '.0';
  }

  return `${integerPart}.${trimmedDecimal}`;
}

/**
 * DSTN → Wei 변환
 *
 * 사용 예시:
 * - dstnToWei("1") // "1000000000000000000"
 * - dstnToWei("0.5") // "500000000000000000"
 * - dstnToWei("1.5") // "1500000000000000000"
 *
 * @param dstn - DSTN 단위 금액 (number 또는 string)
 * @returns Wei 단위의 문자열
 */
export function dstnToWei(dstn: number | string): string {
  const dstnStr = typeof dstn === 'number' ? dstn.toString() : dstn;

  // 소수점이 있는 경우
  if (dstnStr.includes('.')) {
    const [integer, decimal] = dstnStr.split('.');

    // 소수점 18자리로 패딩
    const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);

    const integerWei = BigInt(integer || '0') * WEI_PER_DSTN;
    const decimalWei = BigInt(paddedDecimal);

    return (integerWei + decimalWei).toString();
  }

  // 정수인 경우
  return (BigInt(dstnStr) * WEI_PER_DSTN).toString();
}

/**
 * DSTN 포맷팅 (단위 표시 포함)
 *
 * 사용 예시:
 * - formatDstn("1000000000000000000") // "1.0 DSTN"
 * - formatDstn("1500000000000000000", 2) // "1.5 DSTN"
 *
 * @param wei - Wei 단위 금액
 * @param decimals - 소수점 자리수 (기본값: 4)
 * @returns 포맷된 문자열 (단위 포함)
 */
export function formatDstn(wei: string | bigint, decimals: number = 4): string {
  return `${weiToDstn(wei, decimals)} DSTN`;
}
