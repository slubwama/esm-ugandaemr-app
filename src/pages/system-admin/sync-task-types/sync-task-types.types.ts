export interface SyncTaskType {
  uuid: string;
  name: string;
  dataType?: string;
  dataTypeId?: string;
  url?: string;
  urlToken?: string;
  urlUserName?: string;
  urlPassword?: string;
  tokenExpiryDate?: string;
  tokenType?: string;
  tokenRefreshKey?: string;
}

export interface SyncTaskTypeFormData {
  name: string;
  dataType?: string;
  dataTypeId?: string;
  url?: string;
  urlUserName?: string;
  urlPassword?: string;
  urlToken?: string;
  tokenExpiryDate?: string;
  tokenType?: string;
  tokenRefreshKey?: string;
}

export interface SyncTaskTypeResponse {
  results: SyncTaskType[];
}
