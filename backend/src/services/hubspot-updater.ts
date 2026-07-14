import { Client } from '@hubspot/api-client';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

const hubspotClient = new Client({
  accessToken: env.HUBSPOT_SERVICE_KEY,
});

const OBJECT_TYPE_MAP: Record<string, string> = {
  CONTACT: 'contacts',
  COMPANY: 'companies',
  DEAL: 'deals',
  TICKET: 'tickets',
};

function resolveObjectType(objectType: string): string {
  return OBJECT_TYPE_MAP[objectType] ?? objectType.toLowerCase();
}

export async function updateHubSpotObject(
  objectType: string,
  objectId: number,
  properties: Record<string, string>
): Promise<void> {
  const resolvedType = resolveObjectType(objectType);

  await hubspotClient.crm.basicApi.update(resolvedType, String(objectId), { properties });
}
