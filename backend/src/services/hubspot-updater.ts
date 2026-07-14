import axios from 'axios';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

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
  const url = `${HUBSPOT_API_BASE}/crm/v3/objects/${resolvedType}/${objectId}`;

  try {
    await axios.patch(
      url,
      { properties },
      {
        headers: {
          Authorization: `Bearer ${env.HUBSPOT_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const hubspotError = error.response.data;
      throw new Error(
        `HubSpot API error ${error.response.status}: ${JSON.stringify(hubspotError)}`
      );
    }
    throw error;
  }
}
