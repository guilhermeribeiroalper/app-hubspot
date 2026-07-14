import type { FieldMapping } from '../types/workflow.js';

function parsePathKey(key: string): { name: string; index?: number } {
  const bracketMatch = key.match(/^([^\[]+)\[(\d+)\]$/);
  if (bracketMatch) {
    return { name: bracketMatch[1], index: parseInt(bracketMatch[2], 10) };
  }
  return { name: key };
}

function getByPath(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const rawKey of keys) {
    if (current === null || current === undefined) return undefined;

    const { name, index } = parsePathKey(rawKey);

    if (name) {
      if (typeof current !== 'object' || !(name in (current as Record<string, unknown>))) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[name];
    }

    if (index !== undefined) {
      if (!Array.isArray(current)) return undefined;
      current = current[index];
    }
  }

  return current;
}

export function mapResponseToProperties(
  responseData: unknown,
  fieldMapping: FieldMapping
): Record<string, string> {
  const properties: Record<string, string> = {};

  for (const [responsePath, hubspotProperty] of Object.entries(fieldMapping)) {
    const value = getByPath(responseData, responsePath);

    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        properties[hubspotProperty] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        properties[hubspotProperty] = JSON.stringify(value);
      } else {
        properties[hubspotProperty] = String(value);
      }
    }
  }

  return properties;
}

export function parseFieldMapping(fieldMappingJson: string): FieldMapping {
  try {
    const parsed = JSON.parse(fieldMappingJson);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    throw new Error('Field mapping must be a JSON object');
  } catch (error) {
    throw new Error(`Invalid field_mapping JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}
