import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { env } from '@/config/env';
import { healthRouter } from '@/modules/health';
import { sendError } from '@/lib/response';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api/v1/health', healthRouter);

app.use((_req: Request, res: Response) => {
  sendError(res, 404, 'NOT_FOUND', 'The requested resource does not exist.');
});

// Minimal fallback handler for Milestone 0 — becomes the full AppError-based
// centralized handler described in docs/architecture.md §11 once Milestone 2
// introduces services that throw domain errors.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
});
