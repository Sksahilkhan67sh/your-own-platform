import { Resend } from 'resend';
import { env } from './env.js';
import { logger } from './logger.js';

export const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

if (!env.RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY not set — email notifications are disabled.');
}
