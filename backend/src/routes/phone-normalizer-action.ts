import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loadEnv } from '../config/env.js';
import { validateHubSpotSignature } from '../services/hubspot-signature.js';
import { normalizePhone } from '../services/phone-normalizer.js';
import { isDuplicate, markProcessed } from '../lib/idempotency.js';

// Shape of the HubSpot callback for this action. We only depend on the bits
// we need: callbackId (for idempotency) and inputFields.raw_phone.
interface PhoneNormalizerPayload {
  callbackId: string;
  inputFields: {
    raw_phone?: string;
  };
}

export async function phoneNormalizerRoute(app: FastifyInstance): Promise<void> {
  const env = loadEnv();

  app.post('/workflow-action/phone-normalizer', async (
    request: FastifyRequest<{ Body: PhoneNormalizerPayload }>,
    reply: FastifyReply,
  ) => {
    const rawBody = JSON.stringify(request.body);
    const signature = request.headers['x-hubspot-signature-v3'] as string | undefined;

    if (env.CLIENT_SECRET && !validateHubSpotSignature(rawBody, signature, env.CLIENT_SECRET)) {
      request.log.warn('Invalid HubSpot signature on phone-normalizer');
      return reply.status(401).send({
        outputFields: {
          hs_execution_state: 'FAIL_CONTINUE',
          error_message: 'Invalid signature',
        },
      });
    }

    const payload = request.body as PhoneNormalizerPayload;
    const callbackId = payload?.callbackId ?? '';
    const rawPhone = payload?.inputFields?.raw_phone ?? '';

    const execLog = request.log.child({ callbackId, route: 'phone-normalizer' });

    if (callbackId && isDuplicate(callbackId)) {
      execLog.info('Duplicate callbackId, skipping');
      return reply.status(200).send({
        outputFields: {
          hs_execution_state: 'SUCCESS',
          error_message: '',
        },
      });
    }

    try {
      const result = normalizePhone(rawPhone);
      if (callbackId) markProcessed(callbackId);

      execLog.info(
        { rawPhone, ...result },
        'Phone normalized',
      );

      return reply.status(200).send({
        outputFields: {
          hs_execution_state: 'SUCCESS',
          error_message: result.error_message,
          phone_clean: result.phone_clean,
          country_code: result.country_code,
          digit_count: String(result.digit_count),
          had_plus: result.had_plus,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      execLog.error({ err: message }, 'Phone normalizer failed');
      if (callbackId) markProcessed(callbackId);

      return reply.status(200).send({
        outputFields: {
          hs_execution_state: 'FAIL_CONTINUE',
          error_message: message,
        },
      });
    }
  });
}
