import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Connect,
  Settings,
  Calendar,
  ChevronRight,
  Document,
  Mobile,
  Dashboard,
  Upload,
  Group,
} from '@carbon/react/icons';
import styles from './system-admin.scss';
import SyncDashboardContent from './sync-dashboard/sync-dashboard.component';
import SyncProfilesContent from './sync-profiles';
import SyncTaskTypesContent from './sync-task-types';
import ScheduleTasksContent from './schedule-tasks/schedule-tasks.component';
import SMSSettingsContent from './sms-settings/sms-settings.component';
import ViralLoadUploadContent from './viral-load-upload/viral-load-upload.component';
import CohortManagementContent from './cohort-management';

type AdminSection =
  | 'overview'
  | 'sync-dashboard'
  | 'sync-profiles'
  | 'sync-task-types'
  | 'schedule-tasks'
  | 'cohort-management'
  | 'viral-load-upload'
  | 'sms-settings';

const SystemAdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const navItems = [
    {
      id: 'sync-dashboard' as AdminSection,
      label: t('syncDashboard', 'Sync Dashboard'),
      description: t('syncDashboardDesc', 'Overview of sync operations and monitoring'),
      icon: Dashboard,
    },
    {
      id: 'sync-profiles' as AdminSection,
      label: t('syncProfiles', 'Sync Profiles'),
      description: t('syncProfilesDesc', 'Configure and manage FHIR sync profiles'),
      icon: Connect,
    },
    {
      id: 'sync-task-types' as AdminSection,
      label: t('syncTaskTypes', 'Sync Task Types'),
      description: t('syncTaskTypesDesc', 'Manage sync task types and view execution history'),
      icon: Settings,
    },
    {
      id: 'schedule-tasks' as AdminSection,
      label: t('scheduleTaskManager', 'Schedule Task Manager'),
      description: t('scheduleTaskManagerDesc', 'Schedule and automate recurring tasks'),
      icon: Calendar,
    },
    {
      id: 'cohort-management' as AdminSection,
      label: t('cohortManagement', 'Cohort Management'),
      description: t('cohortManagementDesc', 'Manage DSD refill groups and patient enrollment'),
      icon: Group,
    },
    {
      id: 'viral-load-upload' as AdminSection,
      label: t('viralLoadUpload', 'Viral Load Upload'),
      description: t('viralLoadUploadDesc', 'Upload viral load test results from CPHL'),
      icon: Upload,
    },
    {
      id: 'sms-settings' as AdminSection,
      label: t('smsSettings', 'SMS Settings'),
      description: t('smsSettingsDesc', 'Configure SMS gateway and appointment reminder settings'),
      icon: Mobile,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'sync-dashboard':
        return <SyncDashboardContent />;
      case 'sync-profiles':
        return <SyncProfilesContent />;
      case 'sync-task-types':
        return <SyncTaskTypesContent />;
      case 'schedule-tasks':
        return <ScheduleTasksContent />;
      case 'cohort-management':
        return <CohortManagementContent />;
      case 'viral-load-upload':
        return <ViralLoadUploadContent />;
      case 'sms-settings':
        return <SMSSettingsContent />;
      default:
        return (
          <div className={styles.overviewContent}>
            <div className={styles.overviewHeader}>
              <h2>{t('systemAdmin', 'System Administration')}</h2>
              <p>{t('systemAdminDesc', 'Manage system configuration, sync operations, and scheduled tasks')}</p>
            </div>
            <div className={styles.overviewCards}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={styles.overviewCard}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <div className={styles.cardIcon}>
                      <Icon size={32} />
                    </div>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                    <ChevronRight size={20} className={styles.cardArrow} />
                  </div>
                );
              })}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.adminLayout}>
      <div className={styles.adminSidebar}>
        <div className={styles.sidebarHeader}>
          <h2>{t('systemAdmin', 'System Admin')}</h2>
        </div>
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={20} className={styles.navIcon} />
                <div className={styles.navContent}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </div>
                {isActive && <ChevronRight size={16} className={styles.navArrow} />}
              </button>
            );
          })}
        </nav>
      </div>
      <div className={styles.adminContent}>
        <div className={styles.contentHeader}>
          {activeSection !== 'overview' && (
            <button
              className={styles.backButton}
              onClick={() => setActiveSection('overview')}
            >
              ← {t('backToOverview', 'Back to Overview')}
            </button>
          )}
          <h1>{navItems.find(item => item.id === activeSection)?.label || t('systemAdmin', 'System Admin')}</h1>
        </div>
        <div className={styles.contentBody}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemAdminPage;
