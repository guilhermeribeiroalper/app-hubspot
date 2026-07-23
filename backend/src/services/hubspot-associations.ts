import axios from 'axios';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

export async function getAssociatedCompanyId(
  objectType: string,
  objectId: number
): Promise<number | null> {
  const url = `${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}/${objectId}/associations/companies`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${env.HUBSPOT_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const results = response.data?.results;
    if (results && results.length > 0) {
      return parseInt(results[0].id, 10);
    }
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const hubspotError = error.response.data;
      throw new Error(
        `HubSpot API error fetching associations: ${error.response.status}: ${JSON.stringify(hubspotError)}`
      );
    }
    throw error;
  }
}

export async function getCompanyProperties(
  companyId: number,
  properties: string[]
): Promise<Record<string, string>> {
  const url = `${HUBSPOT_API_BASE}/crm/v3/objects/companies/${companyId}`;
  const params = { properties: properties.join(',') };

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${env.HUBSPOT_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      params,
    });

    return response.data?.properties || {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const hubspotError = error.response.data;
      throw new Error(
        `HubSpot API error fetching company: ${error.response.status}: ${JSON.stringify(hubspotError)}`
      );
    }
    throw error;
  }
}
