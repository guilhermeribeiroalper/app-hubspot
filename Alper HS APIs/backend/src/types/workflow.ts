export interface HubSpotWorkflowPayload {
  callbackId: string;
  origin: {
    portalId: number;
    actionDefinitionId: number;
    actionDefinitionVersion: number;
  };
  context: {
    source: string;
    workflowId: number;
  };
  object: {
    objectId: number;
    properties: Record<string, string>;
    objectType: string;
  };
  inputFields: InputFields;
}

export interface InputFields {
  api_url: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  auth_type: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_value?: string;
  custom_headers?: string;
  request_body?: string;
  field_mapping: string;
  timeout_ms?: number;
}

export interface FieldMapping {
  [responsePath: string]: string;
}

export interface WorkflowOutputFields {
  hs_execution_state?: 'SUCCESS' | 'FAIL_CONTINUE' | 'BLOCK';
  status?: string;
  properties_updated?: string;
  error_message?: string;
  [key: string]: string | undefined;
}

export interface WorkflowResponse {
  outputFields: WorkflowOutputFields;
}
