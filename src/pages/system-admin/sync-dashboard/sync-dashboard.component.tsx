import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tile,
  InlineLoading,
  Tag,
} from '@carbon/react';
import {
  Dashboard,
  Connect,
  Settings,
  Calendar,
  Document,
  Mobile,
  Upload,
  Checkmark,
  Warning,
  Activity,
  Flash,
  ArrowRight,
  ArrowUp,
  Security,
  ChartBullet,
} from '@carbon/react/icons';
import { useNavigate } from 'react-router-dom';
import { useLayoutType } from '@openmrs/esm-framework';
import styles from './sync-dashboard.scss';

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  badge?: string;
  status?: 'active' | 'warning' | 'error';
  stats?: {
    label: string;
    value: string | number;
  }[];
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  primary?: boolean;
}

const SystemAdminLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTablet = useLayoutType() === 'tablet';

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const adminSections: AdminSection[] = useMemo(
    () => [
      {
        id: 'sync-dashboard',
        title: t('syncDashboard', 'Sync Dashboard'),
        description: t('syncDashboardDesc', 'Monitor sync operations, view metrics, and track system performance'),
        icon: Dashboard,
        route: '/system-admin/sync-dashboard',
        status: 'active',
        stats: [
          { label: t('activeSyncs', 'Active Syncs'), value: 3 },
          { label: t('successRate', 'Success Rate'), value: '98.5%' },
        ],
      },
      {
        id: 'sync-profiles',
        title: t('syncProfiles', 'Sync Profiles'),
        description: t('syncProfilesDesc', 'Configure and manage FHIR sync profiles for data exchange'),
        icon: Connect,
        route: '/system-admin/sync-profiles',
        badge: '5',
        stats: [
          { label: t('totalProfiles', 'Total Profiles'), value: 5 },
          { label: t('activeProfiles', 'Active'), value: 4 },
        ],
      },
      {
        id: 'sync-task-types',
        title: t('syncTaskTypes', 'Sync Task Types'),
        description: t('syncTaskTypesDesc', 'Manage task types for sync operations and data processing'),
        icon: Settings,
        route: '/system-admin/sync-task-types',
        stats: [
          { label: t('taskTypes', 'Task Types'), value: 12 },
          { label: t('enabled', 'Enabled'), value: 10 },
        ],
      },
      {
        id: 'schedule-tasks',
        title: t('scheduleTaskManager', 'Schedule Task Manager'),
        description: t('scheduleTaskManagerDesc', 'Schedule and automate recurring tasks and maintenance operations'),
        icon: Calendar,
        route: '/system-admin/schedule-tasks',
        status: 'active',
        stats: [
          { label: t('scheduledTasks', 'Scheduled Tasks'), value: 8 },
          { label: t('activeTasks', 'Active'), value: 6 },
        ],
      },
      {
        id: 'sync-logs',
        title: t('syncLogs', 'Sync Logs'),
        description: t('syncLogsDesc', 'View detailed sync operation logs and troubleshooting history'),
        icon: Document,
        route: '/system-admin/sync-logs',
        badge: '24h',
        stats: [
          { label: t('recentLogs', 'Last 24h'), value: 156 },
          { label: t('errors', 'Errors'), value: 2 },
        ],
      },
      {
        id: 'viral-load-upload',
        title: t('viralLoadUpload', 'Viral Load Upload'),
        description: t('viralLoadUploadDesc', 'Upload and process viral load test results from CPHL'),
        icon: Upload,
        route: '/system-admin/viral-load-upload',
        stats: [
          { label: t('uploadsToday', 'Uploads Today'), value: 23 },
          { label: t('processed', 'Processed'), value: 21 },
        ],
      },
      {
        id: 'sms-settings',
        title: t('smsSettings', 'SMS Settings'),
        description: t('smsSettingsDesc', 'Configure SMS gateway and appointment reminder settings'),
        icon: Mobile,
        route: '/system-admin/sms-settings',
        status: 'active',
        stats: [
          { label: t('status', 'Status'), value: 'Connected' },
          { label: t('sentToday', 'Sent Today'), value: 145 },
        ],
      },
    ],
    [t]
  );

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'trigger-sync',
        label: t('triggerSync', 'Trigger Sync'),
        description: t('triggerSyncDesc', 'Manually start sync operations'),
        icon: Activity,
        route: '/system-admin/sync-profiles',
        primary: true,
      },
      {
        id: 'view-logs',
        label: t('viewLogs', 'View Logs'),
        description: t('viewLogsDesc', 'Check sync operation history'),
        icon: Document,
        route: '/system-admin/sync-logs',
      },
      {
        id: 'add-profile',
        label: t('addProfile', 'Add Profile'),
        description: t('addProfileDesc', 'Create new sync profile'),
        icon: Connect,
        route: '/system-admin/sync-profiles',
      },
      {
        id: 'schedule-task',
        label: t('scheduleTask', 'Schedule Task'),
        description: t('scheduleTaskDesc', 'Set up automated tasks'),
        icon: Calendar,
        route: '/system-admin/schedule-tasks',
      },
    ],
    [t]
  );

  const systemMetrics = useMemo(
    () => [
      {
        label: t('systemStatus', 'System Status'),
        value: t('operational', 'Operational'),
        icon: Checkmark,
        type: 'success' as const,
      },
      {
        label: t('activeSyncs', 'Active Syncs'),
        value: '3',
        icon: Activity,
        type: 'info' as const,
      },
      {
        label: t('successRate', 'Success Rate'),
        value: '98.5%',
        icon: ArrowUp,
        type: 'success' as const,
      },
      {
        label: t('pendingActions', 'Pending Actions'),
        value: '2',
        icon: Warning,
        type: 'warning' as const,
      },
    ],
    [t]
  );

  return (
    <div className={styles.landingContainer}>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div className={styles.headerContent}>
          <h1>{t('systemAdmin', 'System Administration')}</h1>
          <p className={styles.headerDescription}>
            {t('systemAdminWelcome', 'Welcome to System Administration. Manage sync operations, configure settings, and monitor system performance.')}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button kind="secondary" size={isTablet ? 'lg' : 'md'} renderIcon={Activity} onClick={() => handleNavigate('/system-admin/sync-logs')}>
            {t('viewLogs', 'View Logs')}
          </Button>
          <Button kind="primary" size={isTablet ? 'lg' : 'md'} renderIcon={Settings} onClick={() => handleNavigate('/system-admin/sync-profiles')}>
            {t('manageSettings', 'Manage Settings')}
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className={styles.metricsSection}>
        {systemMetrics.map((metric, index) => (
          <div key={index} className={`${styles.metricCard} ${styles[metric.type]}`}>
            <div className={styles.metricIcon}>
              <metric.icon size={24} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={styles.metricLabel}>{metric.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActionsSection}>
        <h2 className={styles.sectionTitle}>{t('quickActions', 'Quick Actions')}</h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action) => (
            <div
              key={action.id}
              className={`${styles.actionCard} ${action.primary ? styles.primaryAction : ''}`}
              onClick={() => handleNavigate(action.route)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.actionIcon}>
                <action.icon size={32} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionLabel}>{action.label}</div>
                <div className={styles.actionDescription}>{action.description}</div>
              </div>
              <ArrowRight size={20} className={styles.actionArrow} />
            </div>
          ))}
        </div>
      </div>

      {/* Admin Sections Grid */}
      <div className={styles.sectionsSection}>
        <h2 className={styles.sectionTitle}>{t('adminSections', 'Administration Sections')}</h2>
        <div className={styles.sectionsGrid}>
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={styles.sectionCard}
                onClick={() => handleNavigate(section.route)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>
                    <Icon size={32} />
                  </div>
                  {section.badge && (
                    <Tag type="blue" className={styles.sectionBadge}>
                      {section.badge}
                    </Tag>
                  )}
                  {section.status && (
                    <div className={`${styles.statusIndicator} ${styles[section.status]}`} />
                  )}
                </div>

                <div className={styles.sectionContent}>
                  <h3 className={styles.sectionTitle}>{section.title}</h3>
                  <p className={styles.sectionDescription}>{section.description}</p>
                </div>

                {section.stats && (
                  <div className={styles.sectionStats}>
                    {section.stats.map((stat, index) => (
                      <div key={index} className={styles.stat}>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={styles.statLabel}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.sectionFooter}>
                  <span className={styles.accessLink}>
                    {t('access', 'Access')}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Info */}
      <div className={styles.infoSection}>
        <Tile className={styles.infoTile}>
          <div className={styles.infoHeader}>
            <Security size={20} />
            <h3>{t('systemInfo', 'System Information')}</h3>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('version', 'Version')}:</span>
              <span className={styles.infoValue}>1.0.4</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('lastSync', 'Last Sync')}:</span>
              <span className={styles.infoValue}>2 minutes ago</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('uptime', 'Uptime')}:</span>
              <span className={styles.infoValue}>99.9%</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('environment', 'Environment')}:</span>
              <span className={styles.infoValue}>Development</span>
            </div>
          </div>
        </Tile>
      </div>
    </div>
  );
};

export default SystemAdminLanding;
