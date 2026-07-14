declare module '@hubspot/api-client' {
  export class Client {
    constructor(config: { accessToken: string });
    crm: {
      basicApi: {
        update(objectType: string, objectId: string, data: { properties: Record<string, string> }): Promise<void>;
      };
    };
  }
}
