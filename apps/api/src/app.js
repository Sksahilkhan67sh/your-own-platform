import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';

import { corsOptions } from './config/cors.js';
import { logger } from './config/logger.js';
import { globalLimiter } from './middlewares/rateLimiters.js';
import { requestId } from './middlewares/requestId.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';
import v1Router from './routes/v1/index.js';

export function createApp() {
  const app = express();

  // Render/Railway sit behind a reverse proxy — required for req.ip and
  // secure cookies to behave correctly.
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // images served from S3 to the web app's <img> tags
    })
  );

  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '100kb' })); // generous for JSON metadata, deliberately too small for raw image bytes
  app.use(cookieParser());
  app.use(mongoSanitize()); // strips any $ or . operators from req.body/query/params — prevents NoSQL operator injection

  app.use('/api/v1', globalLimiter, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
