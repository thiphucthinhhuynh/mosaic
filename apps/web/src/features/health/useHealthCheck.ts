import { useEffect, useState } from 'react';
import type { ApiResponse, HealthStatus } from '@mosaic/shared';
import { env } from '@/lib/env';

type HealthCheckState =
  | { status: 'loading' }
  | { status: 'success'; data: HealthStatus }
  | { status: 'error'; message: string };

export function useHealthCheck(): HealthCheckState {
  const [state, setState] = useState<HealthCheckState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${env.apiUrl}/api/v1/health`, { signal: controller.signal })
      .then(async (res) => {
        const body = (await res.json()) as ApiResponse<HealthStatus>;
        if (!res.ok || body.error) {
          throw new Error(body.error?.message ?? `Request failed with status ${res.status}`);
        }
        setState({ status: 'success', data: body.data });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
