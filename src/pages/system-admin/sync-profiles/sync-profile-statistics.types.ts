export interface SyncFhirProfile {
  uuid: string;
  name: string;
  description?: string;
  resourceType: string;
  dateCreated: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface SyncFhirCase {
  uuid: string;
  caseIdentifier: string;
  patient: {
    uuid: string;
    display: string;
    links: Array<{
      rel: string;
      uri: string;
      resourceAlias: string;
    }>;
  };
  profile: string;
  lastUpdateDate: string;
  dateCreated: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface SyncFhirResource {
  uuid: string;
  resourceType: string;
  profile: string;
  synced: boolean;
  dateSynced: string;
  expiryDate: string;
  statusCode: number;
  statusCodeDetail: string;
  dateCreated: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface SyncFhirProfileLog {
  uuid: string;
  resourceType: string;
  profile: string;
  lastGenerationDate: string;
  numberOfResources: number;
  dateCreated: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}
