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
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
});
