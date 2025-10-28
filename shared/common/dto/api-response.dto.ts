import { ApiProperty } from '@nestjs/swagger';

/**
 * 공통 API 응답 포맷
 *
 * 모든 API 응답은 이 형식을 따릅니다.
 */
export class ApiResponse<T> {
  @ApiProperty({
    description: '응답 상태 코드',
    example: 200,
  })
  status: number;

  @ApiProperty({
    description: '응답 메시지',
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
  })
  data: T;

  constructor(status: number, message: string, data: T) {
    this.status = status;
    this.message = message;
    this.data = data;
  }

  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse(200, message, data);
  }

  /**
   * 생성 성공 응답
   */
  static created<T>(data: T, message = 'Created'): ApiResponse<T> {
    return new ApiResponse(201, message, data);
  }

  /**
   * 에러 응답 생성
   */
  static error<T = null>(status: number, message: string, data: T = null): ApiResponse<T> {
    return new ApiResponse(status, message, data);
  }
}

/**
 * 페이징 메타데이터
 */
export class PaginationMeta {
  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: '전체 항목 수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 5,
  })
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

/**
 * 페이징 응답 데이터
 */
export class PaginatedData<T> {
  @ApiProperty({
    description: '데이터 목록',
    type: 'array',
  })
  items: T[];

  @ApiProperty({
    description: '페이징 메타데이터',
    type: PaginationMeta,
  })
  meta: PaginationMeta;

  constructor(items: T[], meta: PaginationMeta) {
    this.items = items;
    this.meta = meta;
  }
}

/**
 * 페이징 응답
 */
export class PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {
  constructor(items: T[], page: number, limit: number, total: number, message = 'Success') {
    const meta = new PaginationMeta(page, limit, total);
    const data = new PaginatedData(items, meta);
    super(200, message, data);
  }
}
