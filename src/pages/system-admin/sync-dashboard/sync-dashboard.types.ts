export interface SyncDashboardMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  inProgressSyncs: number;
  successRate: number;
  averageResponseTime: number;
  lastSyncTime: string;
  uptimePercentage: number;
}

export interface SyncAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  profileName?: string;
  taskType?: string;
  resolved: boolean;
}

export interface SyncActivity {
  id: string;
  type: 'sync' | 'error' | 'warning' | 'success';
  profileName: string;
  taskType?: string;
  status: 'success' | 'failed' | 'in_progress' | 'pending';
  timestamp: string;
  duration?: number;
  recordsProcessed?: number;
  errorMessage?: string;
}

export interface ActiveSyncOperation {
  id: string;
  profileName: string;
  taskType: string;
  status: 'running' | 'queued' | 'paused';
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  recordsProcessed: number;
  totalRecords: number;
}

export interface DashboardData {
  metrics: SyncDashboardMetrics;
  alerts: SyncAlert[];
  recentActivities: SyncActivity[];
  activeOperations: ActiveSyncOperation[];
}
