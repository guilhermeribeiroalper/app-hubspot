import axios, { AxiosError } from 'axios';
import type { InputFields } from '../types/workflow.js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface ExternalRequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout: number;
}

function buildAuthHeaders(authType: InputFields['auth_type'], authValue: string): Record<string, string> {
  switch (authType) {
    case 'bearer':
      return { Authorization: `Bearer ${authValue}` };
    case 'api_key':
      return { 'X-API-Key': authValue };
    case 'basic':
      return { Authorization: `Basic ${authValue}` };
    default:
      return {};
  }
}

function parseCustomHeaders(customHeaders?: string): Record<string, string> {
  if (!customHeaders) return {};
  try {
    const parsed = JSON.parse(customHeaders);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function interpolateBody(template: string, objectProperties: Record<string, string>): string {
  return template.replace(/\{\{object\.(\w+)\}\}/g, (_, key) => {
    return objectProperties[key] ?? `{{object.${key}}}`;
  });
}

export async function makeExternalRequest(
  inputFields: InputFields,
  objectProperties: Record<string, string>
): Promise<{ status: number; data: unknown }> {
  const authHeaders = buildAuthHeaders(
    inputFields.auth_type,
    inputFields.auth_value ?? ''
  );
  const customHeaders = parseCustomHeaders(inputFields.custom_headers);

  const body = inputFields.request_body
    ? JSON.parse(interpolateBody(inputFields.request_body, objectProperties))
    : undefined;

  const config: ExternalRequestConfig = {
    url: inputFields.api_url,
    method: inputFields.http_method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...customHeaders,
    },
    body,
    timeout: inputFields.timeout_ms ?? 30000,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios({
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.body,
        timeout: config.timeout,
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        return { status: response.status, data: response.data };
      }

      if (response.status === 429) {
        const retryAfter = response.headers['retry-after'];
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delayMs);
        continue;
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delayMs);
        continue;
      }

      return { status: response.status, data: response.data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
        if (attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          await sleep(delayMs);
          continue;
        }
      }

      if (attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delayMs);
        continue;
      }
    }
  }

  throw lastError ?? new Error('External request failed after all retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
