import type { FastifyInstance } from 'fastify';

export function createExecutionLogger(
  app: FastifyInstance,
  callbackId: string,
  objectId: number,
  objectType: string
) {
  return app.log.child({
    callbackId,
    objectId,
    objectType,
  });
}
