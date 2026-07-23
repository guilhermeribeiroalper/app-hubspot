import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loadEnv } from '../config/env.js';
import { validateHubSpotSignature } from '../services/hubspot-signature.js';
import { makeExternalRequest } from '../services/http-client.js';
import { mapResponseToProperties, parseFieldMapping } from '../services/field-mapper.js';
import { isDuplicate, markProcessed } from '../lib/idempotency.js';
import type { HubSpotWorkflowPayload, WorkflowResponse, CombinarCamposInputFields } from '../types/workflow.js';

function combinarCampos(
  properties: Record<string, string>,
  inputFields: CombinarCamposInputFields
): string {
  const separador = inputFields.separador || ' | ';
  const formato = inputFields.formato || '{num} colaboradores | {estado} | {cidade}';

  const numColaboradores = properties[inputFields.numero_colaboradores_prop] || 'N/A';
  const estado = properties[inputFields.estado_prop] || 'N/A';
  const cidade = properties[inputFields.cidade_prop] || 'N/A';

  return formato
    .replace('{num}', numColaboradores)
    .replace('{estado}', estado)
    .replace('{cidade}', cidade)
    .split(separador)
    .filter(v => v !== 'N/A')
    .join(separador);
}

export async function workflowActionRoute(app: FastifyInstance): Promise<void> {
  const env = loadEnv();

  app.post<{
    Body: HubSpotWorkflowPayload;
    Reply: WorkflowResponse;
  }>('/workflow-action', async (request: FastifyRequest<{ Body: HubSpotWorkflowPayload }>, reply: FastifyReply) => {
    const rawBody = JSON.stringify(request.body);
    const signature = request.headers['x-hubspot-signature-v3'] as string | undefined;

    if (env.CLIENT_SECRET && !validateHubSpotSignature(rawBody, signature, env.CLIENT_SECRET)) {
      request.log.warn('Invalid HubSpot signature');
      return reply.status(401).send({
        outputFields: { hs_execution_state: 'FAIL_CONTINUE', error_message: 'Invalid signature' },
      });
    }

    const payload = request.body;
    const { callbackId, object, inputFields } = payload;

    const execLog = request.log.child({ callbackId, objectId: object.objectId, objectType: object.objectType });

    if (isDuplicate(callbackId)) {
      execLog.info('Duplicate callbackId, skipping');
      return reply.status(200).send({
        outputFields: { hs_execution_state: 'SUCCESS', status: 'already_processed' },
      });
    }

    try {
      execLog.info({ apiUrl: inputFields.api_url, method: inputFields.http_method }, 'Starting external request');

      const apiResponse = await makeExternalRequest(inputFields, object.properties);

      execLog.info({ statusCode: apiResponse.status }, 'External request completed');

      const fieldMapping = parseFieldMapping(inputFields.field_mapping);
      const responseData = mapResponseToProperties(apiResponse.data, fieldMapping);

      markProcessed(callbackId);

      const outputFieldNames = Object.keys(responseData).join(', ');
      execLog.info({ outputFields: outputFieldNames }, 'Returning response data as output fields');

      const response: WorkflowResponse = {
        outputFields: {
          hs_execution_state: 'SUCCESS',
          ...responseData,
        },
      };

      return reply.status(200).send(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      execLog.error({ error: errorMessage }, 'Execution failed');

      markProcessed(callbackId);

      return reply.status(200).send({
        outputFields: {
          hs_execution_state: 'FAIL_CONTINUE',
          error_message: errorMessage,
        },
      });
    }
  });
}

export async function combinarCamposRoute(app: FastifyInstance): Promise<void> {
  const env = loadEnv();

  app.post<{
    Body: HubSpotWorkflowPayload;
    Reply: WorkflowResponse;
  }>('/workflow-action/combinar-campos', async (request: FastifyRequest<{ Body: HubSpotWorkflowPayload }>, reply: FastifyReply) => {
    const rawBody = JSON.stringify(request.body);
    const signature = request.headers['x-hubspot-signature-v3'] as string | undefined;

    if (env.CLIENT_SECRET && !validateHubSpotSignature(rawBody, signature, env.CLIENT_SECRET)) {
      request.log.warn('Invalid HubSpot signature');
      return reply.status(401).send({
        outputFields: { hs_execution_state: 'FAIL_CONTINUE', error_message: 'Invalid signature' },
      });
    }

    const payload = request.body;
    const { callbackId, object, inputFields } = payload;

    const execLog = request.log.child({ callbackId, objectId: object.objectId, objectType: object.objectType });

    if (isDuplicate(callbackId)) {
      execLog.info('Duplicate callbackId, skipping');
      return reply.status(200).send({
        outputFields: { hs_execution_state: 'SUCCESS', resultado: 'already_processed' },
      });
    }

    try {
      execLog.info({ inputFields }, 'Starting combinar-campos');

      const camposInput = inputFields as unknown as CombinarCamposInputFields;

      if (!camposInput.numero_colaboradores_prop || !camposInput.estado_prop || !camposInput.cidade_prop) {
        throw new Error('Missing required fields: numero_colaboradores_prop, estado_prop, cidade_prop');
      }

      const resultado = combinarCampos(object.properties, camposInput);

      markProcessed(callbackId);

      execLog.info({ resultado }, 'Returning combined result');

      return reply.status(200).send({
        outputFields: {
          hs_execution_state: 'SUCCESS',
          resultado,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      execLog.error({ error: errorMessage }, 'Execution failed');

      markProcessed(callbackId);

      return reply.status(200).send({
        outputFields: {
          hs_execution_state: 'FAIL_CONTINUE',
          error_message: errorMessage,
        },
      });
    }
  });
}
