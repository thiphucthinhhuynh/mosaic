import type { ApiResponse, ApiSuccess } from '@mosaic/shared';
import { env } from '@/lib/env';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
};

// credentials: 'include' is required for the httpOnly auth cookie to be sent
// to/read from the API, which runs on a different origin in dev (:4000 vs
// :5173) — see docs/architecture.md §19.
async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (json.error) {
    throw new ApiError(res.status, json.error.code, json.error.message);
  }

  return json;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await request<T>(path, options);
  return data;
}

// For endpoints whose envelope carries pagination info in `meta` (e.g. the
// stores list) — most callers just want `data` and should use apiClient.
export function apiClientWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  return request<T>(path, options);
}
