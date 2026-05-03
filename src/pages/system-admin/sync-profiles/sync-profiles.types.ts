export interface SyncFhirProfile {
  uuid: string;
  name: string;
  description?: string;
  profileEnabled: boolean;
  serverUrl: string;
  username?: string;
  password?: string;
  lastSyncDate?: string;
  syncStatus?: 'success' | 'failed' | 'pending' | 'in_progress';
  syncFrequency?: string;
  resourceTypes?: string[];
}

export interface SyncProfileFormData {
  name: string;
  description?: string;
  profileEnabled: boolean;
  serverUrl: string;
  username?: string;
  password?: string;
  syncFrequency?: string;
  resourceTypes?: string[];
}

export interface SyncProfileResponse {
  results: SyncFhirProfile[];
}

export interface SyncApiResponse {
  data?: any;
  error?: string;
  status?: number;
}

export type SyncProfileStatus = 'success' | 'failed' | 'pending' | 'in_progress';
