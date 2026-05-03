export interface SyncTaskLog {
  uuid: string;
  syncTaskType?: {
    uuid: string;
    name: string;
    description?: string;
  };
  status?: string;
  statusCode?: string;
  requireAction: boolean;
  actionCompleted: boolean;
  dateSent: string;
  dateCreated?: string;
}

export interface SyncTaskLogsResponse {
  results: SyncTaskLog[];
  totalCount?: number;
}
