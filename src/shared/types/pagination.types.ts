export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: unknown;
  statusCode?: number;
}

export interface OffsetPagination {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface OffsetPaginatedApiResponse<T> {
  success: true;
  message: string;
  data: T[];
  pagination: OffsetPagination;
}

export interface CursorPaginatedData<T> {
  data: T[];
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface CursorPaginatedApiResponse<T> {
  success: true;
  message: string;
  data: CursorPaginatedData<T>;
}