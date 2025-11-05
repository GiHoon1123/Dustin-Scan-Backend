import {
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
  PaginationMeta,
} from '../../../../shared/common/dto/api-response.dto';

describe('ApiResponse', () => {
  describe('constructor', () => {
    it('should create response', () => {
      const dto = new ApiResponse(200, 'Success', { data: 'test' });
      expect(dto.status).toBe(200);
      expect(dto.message).toBe('Success');
      expect(dto.data).toEqual({ data: 'test' });
    });
  });

  describe('success', () => {
    it('should create success response', () => {
      const dto = ApiResponse.success({ data: 'test' }, 'Custom message');
      expect(dto.status).toBe(200);
      expect(dto.message).toBe('Custom message');
      expect(dto.data).toEqual({ data: 'test' });
    });

    it('should use default message', () => {
      const dto = ApiResponse.success({ data: 'test' });
      expect(dto.message).toBe('Success');
    });
  });

  describe('created', () => {
    it('should create created response', () => {
      const dto = ApiResponse.created({ data: 'test' });
      expect(dto.status).toBe(201);
    });
  });

  describe('error', () => {
    it('should create error response', () => {
      const dto = ApiResponse.error(400, 'Error message', { error: 'details' });
      expect(dto.status).toBe(400);
      expect(dto.message).toBe('Error message');
      expect(dto.data).toEqual({ error: 'details' });
    });

    it('should use null data when not provided', () => {
      const dto = ApiResponse.error(400, 'Error message');
      expect(dto.data).toBeNull();
    });
  });
});

describe('PaginationMeta', () => {
  it('should calculate pagination correctly', () => {
    const meta = new PaginationMeta(1, 20, 100);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.total).toBe(100);
    expect(meta.totalPages).toBe(5);
  });
});

describe('PaginatedData', () => {
  it('should create paginated data', () => {
    const meta = new PaginationMeta(1, 20, 100);
    const data = new PaginatedData(['item1', 'item2'], meta);
    expect(data.items).toHaveLength(2);
    expect(data.meta.total).toBe(100);
  });
});

describe('PaginatedResponse', () => {
  it('should create paginated response', () => {
    const dto = new PaginatedResponse(['item1', 'item2'], 1, 20, 100, 'Custom message');
    expect(dto.status).toBe(200);
    expect(dto.message).toBe('Custom message');
    expect(dto.data.items).toHaveLength(2);
    expect(dto.data.meta.total).toBe(100);
  });
});

