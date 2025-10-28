import { ApiProperty } from '@nestjs/swagger';

/**
 * 공통 API 응답 포맷
 *
 * 모든 API는 이 형식으로 응답을 반환
 */
export class CommonResponseDto<T> {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '응답 메시지', example: '조회 성공' })
  message: string;

  @ApiProperty({ description: '응답 데이터' })
  data: T;

  @ApiProperty({ description: '응답 시간 (ISO 8601)', example: '2025-10-29T00:00:00.000Z' })
  timestamp: string;

  constructor(success: boolean, message: string, data: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = '조회 성공'): CommonResponseDto<T> {
    return new CommonResponseDto(true, message, data);
  }

  static error<T>(message: string, data: T = null): CommonResponseDto<T> {
    return new CommonResponseDto(false, message, data);
  }
}

/**
 * 페이징 정보 DTO
 */
export class PaginationDto {
  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage: number;

  @ApiProperty({ description: '페이지당 개수', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '전체 개수', example: 100 })
  totalCount: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
  hasPrevious: boolean;

  constructor(currentPage: number, pageSize: number, totalCount: number) {
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalCount = totalCount;
    this.totalPages = Math.ceil(totalCount / pageSize);
    this.hasNext = currentPage < this.totalPages;
    this.hasPrevious = currentPage > 1;
  }
}

/**
 * 페이징 응답 데이터 DTO
 */
export class PaginatedDataDto<T> {
  @ApiProperty({ description: '데이터 목록', isArray: true })
  items: T[];

  @ApiProperty({ description: '페이징 정보', type: PaginationDto })
  pagination: PaginationDto;

  constructor(items: T[], currentPage: number, pageSize: number, totalCount: number) {
    this.items = items;
    this.pagination = new PaginationDto(currentPage, pageSize, totalCount);
  }
}

/**
 * 페이징 응답 DTO
 *
 * 목록 조회 API에서 사용
 */
export class PaginatedResponseDto<T> extends CommonResponseDto<PaginatedDataDto<T>> {
  constructor(
    items: T[],
    currentPage: number,
    pageSize: number,
    totalCount: number,
    message = '조회 성공',
  ) {
    const data = new PaginatedDataDto(items, currentPage, pageSize, totalCount);
    super(true, message, data);
  }
}
