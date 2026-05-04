export interface ScheduledTask {
  uuid: string;
  name: string;
  description?: string;
  taskClass: string;
  startTime: string;
  lastExecutionTime?: string;
  repeatInterval: number;
  startOnStartup: boolean;
  startTimePattern: string;
  started: boolean;
  properties: Record<string, any>;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
  resourceVersion: string;
}

export interface ScheduledTaskResponse {
  results: Array<ScheduledTask>;
}

export interface ScheduledTaskFormData {
  name: string;
  description?: string;
  schedulingPattern: string;
  startTime?: string;
  enabled?: boolean;
  repeatInterval?: number;
  timezone?: string;
}

// Sync Task Types
export interface SyncTaskType {
  uuid: string;
  name: string;
  dataType: string;
  dataTypeId: string;
  url: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface SyncTask {
  syncTaskType: SyncTaskType;
  syncTask: string;
  status: string;
  statusCode: number;
  sentToUrl: string;
  dateSent: string;
  requireAction: boolean;
  actionCompleted: boolean;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
  resourceVersion: string;
}

export interface SyncTaskResponse {
  results: Array<SyncTask>;
}
