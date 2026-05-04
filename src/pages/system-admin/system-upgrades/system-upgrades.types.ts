export interface UpgradeTask {
  uuid: string;
  name: string;
  description: string;
  schedulableClass: string;
  startTime?: string;
  repeatInterval?: number;
  started: boolean;
  lastExecutionTime?: string;
}

export interface UpgradeTaskResponse {
  results: Array<UpgradeTask>;
}
