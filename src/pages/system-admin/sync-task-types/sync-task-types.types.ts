export interface SyncTaskType {
  uuid: string;
  name: string;
  description?: string;
  taskEnabled: boolean;
  taskType: string;
  executionOrder?: number;
  retryCount?: number;
  retryInterval?: number;
  lastExecutionDate?: string;
  lastExecutionStatus?: 'success' | 'failed' | 'pending' | 'running';
  executionFrequency?: string;
}

export interface SyncTaskTypeFormData {
  name: string;
  description?: string;
  taskEnabled: boolean;
  taskType: string;
  executionOrder?: number;
  retryCount?: number;
  retryInterval?: number;
  executionFrequency?: string;
}

export interface SyncTaskTypeResponse {
  results: SyncTaskType[];
}

export type TaskExecutionStatus = 'success' | 'failed' | 'pending' | 'running';
