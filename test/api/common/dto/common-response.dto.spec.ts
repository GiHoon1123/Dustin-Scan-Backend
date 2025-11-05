import { CommonResponseDto, PaginatedResponseDto, PaginationDto, PaginatedDataDto } from '../../../../apps/api/src/common/dto/common-response.dto';

describe('CommonResponseDto', () => {
  it('should create success response', () => {
    const response = CommonResponseDto.success({ id: 1 }, '테스트 성공');
    expect(response.success).toBe(true);
    expect(response.message).toBe('테스트 성공');
    expect(response.data).toEqual({ id: 1 });
    expect(response.timestamp).toBeDefined();
  });

  it('should create error response', () => {
    const response = CommonResponseDto.error('테스트 실패', { error: 'test' });
    expect(response.success).toBe(false);
    expect(response.message).toBe('테스트 실패');
    expect(response.data).toEqual({ error: 'test' });
    expect(response.timestamp).toBeDefined();
  });

  it('should create error response with null data', () => {
    const response = CommonResponseDto.error('테스트 실패');
    expect(response.success).toBe(false);
    expect(response.message).toBe('테스트 실패');
    expect(response.data).toBeNull();
  });

  it('should use default message for success', () => {
    const response = CommonResponseDto.success({ id: 1 });
    expect(response.message).toBe('조회 성공');
  });
});

describe('PaginationDto', () => {
  it('should calculate pagination correctly', () => {
    const pagination = new PaginationDto(1, 20, 100);
    expect(pagination.currentPage).toBe(1);
    expect(pagination.pageSize).toBe(20);
    expect(pagination.totalCount).toBe(100);
    expect(pagination.totalPages).toBe(5);
    expect(pagination.hasNext).toBe(true);
    expect(pagination.hasPrevious).toBe(false);
  });

  it('should handle last page', () => {
    const pagination = new PaginationDto(5, 20, 100);
    expect(pagination.hasNext).toBe(false);
    expect(pagination.hasPrevious).toBe(true);
  });

  it('should handle first page', () => {
    const pagination = new PaginationDto(1, 20, 100);
    expect(pagination.hasPrevious).toBe(false);
  });
});

describe('PaginatedDataDto', () => {
  it('should create paginated data', () => {
    const data = new PaginatedDataDto([1, 2, 3], 1, 20, 100);
    expect(data.items).toEqual([1, 2, 3]);
    expect(data.pagination).toBeInstanceOf(PaginationDto);
    expect(data.pagination.totalCount).toBe(100);
  });
});

describe('PaginatedResponseDto', () => {
  it('should create paginated response', () => {
    const response = new PaginatedResponseDto([1, 2, 3], 1, 20, 100, '목록 조회 성공');
    expect(response.success).toBe(true);
    expect(response.message).toBe('목록 조회 성공');
    expect(response.data.items).toEqual([1, 2, 3]);
    expect(response.data.pagination.totalCount).toBe(100);
  });

  it('should use default message', () => {
    const response = new PaginatedResponseDto([1, 2], 1, 20, 50);
    expect(response.message).toBe('조회 성공');
  });
});

