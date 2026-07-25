// Shared response envelope shape — see docs/architecture.md §8.
export type ApiSuccess<T> = {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiFailure = {
  data: null;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
