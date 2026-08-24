import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import { healthRouter } from '@/modules/health';
import { usersRouter } from '@/modules/users';
import { authRouter } from '@/modules/auth';
import { storesRouter } from '@/modules/stores';
import { sendError } from '@/lib/response';
import { errorHandler } from '@/middleware/errorHandler';

export const app = express();

// credentials: true is required for the httpOnly auth cookie to flow between
// the frontend (:5173) and API (:4000) — they're different origins in dev,
// and without this the browser silently drops the cookie on every request.
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/stores', storesRouter);

app.use((_req: Request, res: Response) => {
  sendError(res, 404, 'NOT_FOUND', 'The requested resource does not exist.');
});

app.use(errorHandler);
