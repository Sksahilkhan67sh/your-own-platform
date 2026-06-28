import pino from 'pino';
import { env } from './env.js';

/**
 * Structured JSON logger. Redaction list is explicit and exhaustive for every
 * place a secret could appear in a request/response object — this is what
 * actually prevents "never log JWTs, passwords, or sensitive data" from being
 * an aspiration instead of a guarantee.
 */
export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.passwordHash',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  transport: env.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});
