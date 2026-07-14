import type { FieldMapping } from '../types/workflow.js';

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function mapResponseToProperties(
  responseData: unknown,
  fieldMapping: FieldMapping
): Record<string, string> {
  const properties: Record<string, string> = {};

  for (const [responsePath, hubspotProperty] of Object.entries(fieldMapping)) {
    const value = getByPath(responseData, responsePath);

    if (value !== undefined && value !== null) {
      properties[hubspotProperty] = String(value);
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
