import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { env } from '@/config/env';
import { healthRouter } from '@/modules/health';
import { usersRouter } from '@/modules/users';
import { sendError } from '@/lib/response';
import { errorHandler } from '@/middleware/errorHandler';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/users', usersRouter);

app.use((_req: Request, res: Response) => {
  sendError(res, 404, 'NOT_FOUND', 'The requested resource does not exist.');
});

app.use(errorHandler);
