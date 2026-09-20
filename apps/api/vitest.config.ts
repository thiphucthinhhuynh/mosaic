import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    // Defense-in-depth: apps/api/tsconfig.json now excludes *.test.ts from
    // the build too, but a stale dist/ from before that fix caused Vitest to
    // pick up compiled test files and run them a second time against the
    // real test database — see docs/roadmap.md Milestone 1.
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Integration tests hit one real, shared Postgres test database (§15) —
    // Vitest's default file-level parallelism runs test files concurrently
    // in separate workers, but they aren't isolated from each other at the
    // DB layer. Unscoped list endpoints (e.g. GET /api/v1/stores, browsing
    // every store) are the exposure: two files creating rows in the same
    // table at the same time can shift an in-flight paginated query's
    // results between requests, an intermittent failure discovered when
    // stores.routes.test.ts and users.routes.test.ts's store-creating tests
    // happened to race (Milestone 4 step 3). Running files serially trades
    // some suite wall-clock time for deterministic results — the correct
    // trade-off for tests whose entire point is exercising a real database.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
});
