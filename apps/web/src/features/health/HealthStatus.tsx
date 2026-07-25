import { useHealthCheck } from './useHealthCheck';

export function HealthStatus() {
  const state = useHealthCheck();

  if (state.status === 'loading') {
    return <p>Checking backend status…</p>;
  }

  if (state.status === 'error') {
    return <p role="alert">Backend unreachable: {state.message}</p>;
  }

  return (
    <p>
      Backend status: <strong>{state.data.status}</strong> (as of{' '}
      {new Date(state.data.timestamp).toLocaleTimeString()})
    </p>
  );
}
