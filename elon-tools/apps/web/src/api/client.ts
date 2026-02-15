/**
 * API client with auth handling, error parsing, retry on 429.
 */

import type { ApiResponse } from '@elon-tools/shared';

const BASE = import.meta.env.DEV ? '/api/v1' : 'https://elon-tools-api.elon-parker.workers.dev/api/v1';
const MAX_RETRIES = 2;

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 0,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 429: retry with backoff
  if (res.status === 429 && retries < MAX_RETRIES) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '2', 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return request<T>(path, options, retries + 1);
  }

  // 401: redirect to login
  if (res.status === 401) {
    window.location.href = '/login';
    throw new ApiError('AUTH_MISSING_SESSION', 'Sessão expirada', 401);
  }

  const data = (await res.json()) as ApiResponse<T>;

  if (!data.success || data.error) {
    throw new ApiError(
      data.error?.code ?? 'UNKNOWN',
      data.error?.message ?? 'Erro desconhecido',
      res.status,
      data.error?.details,
    );
  }

  return data.data as T;
}

// Convenience methods
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Stream SSE from an endpoint. Calls onChunk for each text chunk.
 */
export async function streamApi(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
  onDone?: (executionId: string | null) => void,
): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json()) as ApiResponse;
    throw new ApiError(err.error?.code ?? 'UNKNOWN', err.error?.message ?? 'Erro', res.status);
  }

  const execId = res.headers.get('X-Execution-Id');
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.response) onChunk(data.response);
        } catch { /* skip */ }
      }
    }
  }

  onDone?.(execId);
}

export { ApiError };
