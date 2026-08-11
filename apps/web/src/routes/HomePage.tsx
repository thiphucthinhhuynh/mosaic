import { HealthStatus } from '@/features/health';

export function HomePage() {
  return (
    <>
      <h1>Mosaic</h1>
      <HealthStatus />
    </>
  );
}
