/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

/** Utility: success response */
export type SuccessResponse<T> = {
  success: true;
  data: T;
  pagination?: Pagination;
};

/** Utility: error response */
export type ErrorResponse = {
  success: false;
  error: ApiError;
};
