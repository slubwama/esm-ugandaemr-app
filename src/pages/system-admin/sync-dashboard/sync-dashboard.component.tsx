import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tile,
  InlineLoading,
} from '@carbon/react';
import {
  Renew,
  Checkmark,
  Warning,
  Error,
  Information,
  ArrowUp,
  ArrowDown,
  Activity,
  Dashboard as DashboardIcon,
  Timer,
  Flash,
  Wifi,
  ChevronRight,
} from '@carbon/react/icons';
import {
  useDashboardData,
  dismissAlert,
  triggerProfileSync,
} from './sync-dashboard.resources';
import {
  SyncDashboardMetrics,
  type SyncAlert,
  type SyncActivity,
  type ActiveSyncOperation,
} from './sync-dashboard.types';
import { showNotification, showSnackbar, navigate } from '@openmrs/esm-framework';
import styles from './sync-dashboard.scss';

const SyncDashboardContent: React.FC = () => {
  const { t } = useTranslation();
  const { dashboardData, isLoading, isError, mutate } = useDashboardData();

  const handleDismissAlert = useCallback(
    async (alertId: string) => {
      try {
        await dismissAlert(alertId);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('alertDismissed', 'Alert dismissed'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorDismissingAlert', 'Error dismissing alert'),
          kind: 'error',
          description: error.message,
        });
      }
    },
    [mutate, t]
  );

  const handleQuickAction = useCallback(
    async (action: string) => {
      switch (action) {
        case 'trigger-all':
          // Implement trigger all syncs
          showSnackbar({
            isLowContrast: true,
            kind: 'info',
            title: t('triggeringAllSyncs', 'Triggering all sync profiles'),
            autoClose: true,
          });
          break;
        case 'view-logs':
          navigate({ to: '/openmrs/spa/system-admin/sync-logs' });
          break;
        case 'view-profiles':
          navigate({ to: '/openmrs/spa/system-admin/sync-profiles' });
          break;
        case 'view-tasks':
          navigate({ to: '/openmrs/spa/system-admin/sync-task-types' });
          break;
        default:
          break;
      }
    },
    [t]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Checkmark size={16} className={styles.successIcon} />;
      case 'failed':
        return <Error size={16} className={styles.errorIcon} />;
      case 'in_progress':
        return <Renew size={16} className={styles.inProgressIcon} />;
      default:
        return <Warning size={16} className={styles.warningIcon} />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error size={20} className={styles.criticalIcon} />;
      case 'warning':
        return <Warning size={20} className={styles.warningIcon} />;
      default:
        return <Information size={20} className={styles.infoIcon} />;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.dashboardContent}>
        <div className={styles.loadingState}>
          <InlineLoading description={t('loadingDashboard', 'Loading dashboard...')} />
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className={styles.dashboardContent}>
        <Tile className={styles.errorState}>
          <Error size={48} className={styles.errorIcon} />
          <h3>{t('errorLoadingDashboard', 'Error loading dashboard')}</h3>
          <p>{t('failedToLoadDashboard', 'Failed to load dashboard data. Please try again.')}</p>
          <Button onClick={() => mutate()}>{t('retry', 'Retry')}</Button>
        </Tile>
      </div>
    );
  }

  const {
    metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      inProgressSyncs: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastSyncTime: new Date().toISOString(),
      uptimePercentage: 0,
    },
    alerts = [],
    recentActivities = [],
    activeOperations = [],
  } = dashboardData;

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.dashboardContainer}>
        {/* Header */}
        <div className={styles.dashboardHeader}>
          <div>
            <h1>{t('syncDashboard', 'Sync Dashboard')}</h1>
            <p className={styles.dashboardDescription}>
              {t('syncDashboardDesc', 'Monitor and manage sync operations')}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              kind="secondary"
              onClick={() => mutate()}
              renderIcon={Renew}
            >
              {t('refresh', 'Refresh')}
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          <MetricCard
            title={t('totalSyncs', 'Total Syncs')}
            value={metrics.totalSyncs}
            change={`+${metrics.successRate}%`}
            icon={DashboardIcon}
            type="info"
          />
          <MetricCard
            title={t('successfulSyncs', 'Successful')}
            value={metrics.successfulSyncs}
            change={t('successRate', '{{rate}}% success rate', { rate: metrics.successRate })}
            icon={Checkmark}
            type="success"
          />
          <MetricCard
            title={t('failedSyncs', 'Failed')}
            value={metrics.failedSyncs}
            change={t('needsAttention', 'Needs attention')}
            icon={Error}
            type="error"
          />
          <MetricCard
            title={t('inProgress', 'In Progress')}
            value={metrics.inProgressSyncs}
            change={t('activelySyncing', 'Actively syncing')}
            icon={Activity}
            type="warning"
          />
          <MetricCard
            title={t('avgResponseTime', 'Avg Response Time')}
            value={`${metrics.averageResponseTime}ms`}
            change={t('performant', 'Performant')}
            icon={Flash}
            type="info"
          />
          <MetricCard
            title={t('uptime', 'Uptime')}
            value={`${metrics.uptimePercentage}%`}
            change={t('reliable', 'Reliable')}
            icon={Wifi}
            type="success"
          />
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsPanel}>
          <h2>{t('quickActions', 'Quick Actions')}</h2>
          <div className={styles.actionsGrid}>
            <QuickActionCard
              icon={Renew}
              label={t('triggerAllSyncs', 'Trigger All Syncs')}
              description={t('startAllSyncProfiles', 'Start all sync profiles')}
              onClick={() => handleQuickAction('trigger-all')}
            />
            <QuickActionCard
              icon={Activity}
              label={t('viewLogs', 'View Sync Logs')}
              description={t('viewSyncOperationLogs', 'View sync operation logs')}
              onClick={() => handleQuickAction('view-logs')}
            />
            <QuickActionCard
              icon={DashboardIcon}
              label={t('manageProfiles', 'Manage Profiles')}
              description={t('configureSyncProfiles', 'Configure sync profiles')}
              onClick={() => handleQuickAction('view-profiles')}
            />
            <QuickActionCard
              icon={Timer}
              label={t('scheduleTasks', 'Schedule Tasks')}
              description={t('manageScheduledTasks', 'Manage scheduled tasks')}
              onClick={() => handleQuickAction('view-tasks')}
            />
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className={styles.alertsSection}>
            <div className={styles.sectionHeader}>
              <h2>{t('alerts', 'Alerts')}</h2>
              <Button kind="ghost" size="sm">
                {t('viewAll', 'View All')} ({alerts.length})
              </Button>
            </div>
            <div className={styles.alertsList}>
              {alerts.slice(0, 3).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => handleDismissAlert(alert.id)}
                  severityIcon={getSeverityIcon(alert.severity)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Operations */}
        {activeOperations.length > 0 && (
          <div className={styles.activeOperationsSection}>
            <div className={styles.sectionHeader}>
              <h2>{t('activeOperations', 'Active Operations')}</h2>
              <Button kind="ghost" size="sm">
                {t('viewAll', 'View All')} ({activeOperations.length})
              </Button>
            </div>
            <div className={styles.operationsList}>
              {activeOperations.slice(0, 3).map((operation) => (
                <OperationCard key={operation.id} operation={operation} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className={styles.activitiesSection}>
          <div className={styles.sectionHeader}>
            <h2>{t('recentActivities', 'Recent Activities')}</h2>
            <Button
              kind="ghost"
              size="sm"
              onClick={() => navigate({ to: '/openmrs/spa/system-admin/sync-logs' })}
              renderIcon={ChevronRight}
            >
              {t('viewAllLogs', 'View All Logs')}
            </Button>
          </div>
          <div className={styles.activitiesTimeline}>
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  statusIcon={getStatusIcon(activity.type)}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <Activity size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>
                  {t('noRecentActivities', 'No Recent Activities')}
                </h3>
                <p className={styles.emptyDescription}>
                  {t('noRecentActivitiesDesc', 'Sync activities will appear here')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  title: string;
  value: number | string;
  change: string;
  icon: React.ComponentType<any>;
  type: 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, type }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricTitle}>{title}</span>
        <div className={`${styles.metricIcon} ${styles[type]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={`${styles.metricChange} ${type === 'success' ? styles.positive : type === 'error' ? styles.negative : ''}`}>
        {change}
      </div>
    </div>
  );
};

interface AlertCardProps {
  alert: SyncAlert;
  onDismiss: () => void;
  severityIcon: React.ReactNode;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onDismiss, severityIcon }) => {
  const { t } = useTranslation();

  return (
    <div className={`${styles.alertItem} ${styles[alert.severity]}`}>
      <div className={styles.alertIcon}>{severityIcon}</div>
      <div className={styles.alertContent}>
        <div className={styles.alertTitle}>{alert.title}</div>
        <div className={styles.alertMessage}>{alert.message}</div>
        <div className={styles.alertMeta}>
          <span>{new Date(alert.timestamp).toLocaleString()}</span>
          {alert.profileName && <span>• {alert.profileName}</span>}
        </div>
      </div>
      <div className={styles.alertActions}>
        <Button kind="ghost" size="sm" onClick={onDismiss}>
          {t('dismiss', 'Dismiss')}
        </Button>
      </div>
    </div>
  );
};

interface OperationCardProps {
  operation: ActiveSyncOperation;
}

const OperationCard: React.FC<OperationCardProps> = ({ operation }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.operationCard}>
      <div className={styles.operationHeader}>
        <span className={styles.operationName}>{operation.profileName}</span>
        <div className={styles.operationStatus}>
          <span className={`${styles.statusBadge} ${styles[operation.status]}`}>
            {t(operation.status, operation.status)}
          </span>
        </div>
      </div>
      <div className={styles.operationProgress}>
        <div className={styles.progressInfo}>
          <span>
            {operation.recordsProcessed} / {operation.totalRecords} {t('records', 'records')}
          </span>
          <span>{operation.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${operation.progress}%` }}
          />
        </div>
      </div>
      <div className={styles.operationMeta}>
        <span>{t('started', 'Started')}: {new Date(operation.startTime).toLocaleTimeString()}</span>
        {operation.estimatedCompletion && (
          <span>
            {t('estimatedCompletion', 'Est. completion')}: {new Date(operation.estimatedCompletion).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

interface ActivityItemProps {
  activity: SyncActivity;
  statusIcon: React.ReactNode;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, statusIcon }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.activityItem}>
      <div className={`${styles.activityMarker} ${styles[activity.type]}`} />
      <div className={styles.activityContent}>
        <div className={styles.activityHeader}>
          <span className={styles.activityType}>{activity.profileName}</span>
          <span className={styles.activityTime}>
            {new Date(activity.timestamp).toLocaleString()}
          </span>
        </div>
        <div className={styles.activityDetails}>
          {activity.taskType && `${activity.taskType} • `}
          {t(activity.status, activity.status)}
        </div>
        {activity.recordsProcessed && (
          <div className={styles.activityStats}>
            <div className={styles.stat}>
              <Activity size={12} />
              <span>
                {activity.recordsProcessed} {t('records', 'records')}
              </span>
            </div>
            {activity.duration && (
              <div className={styles.stat}>
                <Timer size={12} />
                <span>{activity.duration}s</span>
              </div>
            )}
          </div>
        )}
        {activity.errorMessage && (
          <div className={styles.errorMessage}>{activity.errorMessage}</div>
        )}
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  label,
  description,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.quickActionCard} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.actionIcon}>
        <Icon size={24} />
      </div>
      <div className={styles.actionLabel}>{label}</div>
      <div className={styles.actionDescription}>{description}</div>
    </div>
  );
};

export default SyncDashboardContent;
