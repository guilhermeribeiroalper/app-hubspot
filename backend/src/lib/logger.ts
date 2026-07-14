import pino from 'pino';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createExecutionLogger(callbackId: string, objectId: number, objectType: string) {
  return logger.child({
    callbackId,
    objectId,
    objectType,
  });
}
