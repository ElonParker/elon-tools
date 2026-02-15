import type { ApiResponse, Pagination } from '@elon-tools/shared';

/** Build a success JSON response */
export function success<T>(data: T, pagination?: Pagination, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (pagination) body.pagination = pagination;
  return Response.json(body, { status });
}

/** Build an error JSON response */
export function error(code: string, message: string, status: number, details?: unknown): Response {
  const body: ApiResponse = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return Response.json(body, { status });
}
