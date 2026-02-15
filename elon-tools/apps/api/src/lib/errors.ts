import type { ErrorCode } from '@elon-tools/shared';

/**
 * Application error with structured code + HTTP status.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ── Factory helpers ──

export function badRequest(code: ErrorCode, message: string, details?: unknown): AppError {
  return new AppError(code, 400, message, details);
}

export function unauthorized(code: ErrorCode, message: string): AppError {
  return new AppError(code, 401, message);
}

export function forbidden(code: ErrorCode, message: string): AppError {
  return new AppError(code, 403, message);
}

export function notFound(code: ErrorCode, message: string): AppError {
  return new AppError(code, 404, message);
}

export function conflict(code: ErrorCode, message: string): AppError {
  return new AppError(code, 409, message);
}

export function tooManyRequests(message: string, retryAfter?: number): AppError {
  const err = new AppError('RATE_LIMIT_EXCEEDED', 429, message);
  (err as any).retryAfter = retryAfter;
  return err;
}

export function internalError(message = 'Erro interno'): AppError {
  return new AppError('INTERNAL_ERROR', 500, message);
}
