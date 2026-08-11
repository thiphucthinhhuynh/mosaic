import { config as loadEnvFile } from 'dotenv';
import { z } from 'zod';

// NODE_ENV is set by the process launching us (the OS shell for `npm run dev`,
// or Vitest automatically for tests) — it decides which .env file to load,
// so this must run before the schema below reads process.env.
loadEnvFile({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n' + z.prettifyError(parsed.error));
  throw new Error('Invalid environment variables — see errors above.');
}

export const env = parsed.data;
