import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from './config/env.js';
import { workflowActionRoute } from './routes/workflow-action.js';

async function main(): Promise<void> {
  const env = loadEnv();

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
    },
    bodyLimit: 1024 * 1024,
  });

  await app.register(cors, {
    origin: ['https://app.hubspot.com', 'https://api.hubapi.com'],
  });

  await app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
  });

  await app.register(workflowActionRoute);

  app.get('/health', async () => ({ ok: true }));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
