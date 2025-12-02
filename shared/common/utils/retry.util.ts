import axios from 'axios';

/**
 * 재시도 가능한 에러인지 확인
 *
 * 재시도 가능:
 * - 네트워크 에러 (ECONNREFUSED, ETIMEDOUT, ENOTFOUND 등)
 * - 타임아웃 (ECONNABORTED)
 * - 5xx 서버 에러 (500, 502, 503, 504 등)
 *
 * 재시도 불가:
 * - 404 (리소스 없음 - 정상 상황일 수 있음)
 * - 4xx 클라이언트 에러 (400, 401, 403 등)
 */
export function isRetryableError(error: any): boolean {
  // Axios 에러가 아닌 경우 재시도 불가
  if (!axios.isAxiosError(error)) {
    return false;
  }

  // 네트워크 에러 (서버에 도달하지 못함)
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNABORTED') {
    return true;
  }

  // HTTP 응답이 있는 경우
  if (error.response) {
    const status = error.response.status;

    // 5xx 서버 에러는 재시도 가능
    if (status >= 500 && status < 600) {
      return true;
    }

    // 404는 재시도 불가 (블록이 아직 생성되지 않았을 수 있음 - 정상 상황)
    if (status === 404) {
      return false;
    }

    // 4xx 클라이언트 에러는 재시도 불가
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  // 그 외 에러는 재시도 불가
  return false;
}

/**
 * 지수적 백오프 재시도 유틸리티
 *
 * @param fn - 재시도할 비동기 함수
 * @param options - 재시도 옵션
 * @returns 함수 실행 결과
 *
 * @example
 * ```typescript
 * const result = await retryWithExponentialBackoff(
 *   () => chainClient.getBlockByNumber(100),
 *   { maxRetries: 5, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (error: any, attempt: number, delay: number) => void;
  } = {},
): Promise<T> {
  const {
    maxRetries = 5,
    initialDelay = 1000, // 1초
    maxDelay = 180000, // 3분 (180초)
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 재시도 불가능한 에러면 즉시 던짐
      if (!isRetryableError(error)) {
        throw error;
      }

      // 마지막 시도면 에러 던짐
      if (attempt === maxRetries) {
        throw error;
      }

      // 지수적 백오프 계산: delay = initialDelay * 2^attempt
      // 최대 maxDelay로 제한
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      // 재시도 콜백 호출
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      // 대기
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 이론적으로 도달 불가능하지만 타입 안전성을 위해
  throw lastError;
}

