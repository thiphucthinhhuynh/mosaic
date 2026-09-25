import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/apiClient';

const MAX_RETRIES = 3;

// TanStack Query retries every failed query 3 times with backoff by default.
// That's right for network blips and 5xx responses, but a 4xx (404 store/item
// not found, 400 bad id) is deterministic — retrying just delays the error
// state by ~7s before the user sees "not found".
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < MAX_RETRIES;
      },
    },
  },
});
