import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Connect,
  Settings,
  Calendar,
  ChevronRight,
  Mobile,
  Upload,
  Group,
  Renew,
  Information,
} from '@carbon/react/icons';
import styles from './system-admin.scss';

const SystemAdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    {
      id: 'sync-profiles',
      label: t('syncProfiles', 'Sync Profiles'),
      description: t('syncProfilesDesc', 'Configure and manage FHIR sync profiles'),
      icon: Connect,
      path: '/system-admin/sync-profiles',
    },
    {
      id: 'sync-task-types',
      label: t('syncTaskTypes', 'Sync Task Types'),
      description: t('syncTaskTypesDesc', 'Manage sync task types and view execution history'),
      icon: Settings,
      path: '/system-admin/sync-task-types',
    },
    {
      id: 'schedule-tasks',
      label: t('scheduleTaskManager', 'Schedule Task Manager'),
      description: t('scheduleTaskManagerDesc', 'Schedule and automate recurring tasks'),
      icon: Calendar,
      path: '/system-admin/schedule-tasks',
    },
    {
      id: 'cohort-management',
      label: t('cohortManagement', 'Cohort Management'),
      description: t('cohortManagementDesc', 'Manage DSD refill groups and patient enrollment'),
      icon: Group,
      path: '/system-admin/cohort-management',
    },
    {
      id: 'viral-load-upload',
      label: t('viralLoadUpload', 'Viral Load Upload'),
      description: t('viralLoadUploadDesc', 'Upload viral load test results from CPHL'),
      icon: Upload,
      path: '/system-admin/viral-load-upload',
    },
    {
      id: 'sms-settings',
      label: t('sms', 'SMS'),
      description: t('smsDesc', 'Configure SMS gateway and view sent message logs'),
      icon: Mobile,
      path: '/system-admin/sms-settings',
    },
    {
      id: 'system-upgrades',
      label: t('systemUpgrades', 'System Updates & Upgrades'),
      description: t('systemUpgradesDesc', 'Execute system upgrades and update EMR components'),
      icon: Renew,
      path: '/system-admin/system-upgrades',
    },
    {
      id: 'about-systems',
      label: t('aboutSystems', 'About Systems'),
      description: t('aboutSystemsDesc', 'View system information, version details, and facility code'),
      icon: Information,
      path: '/system-admin/about-systems',
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h2>{t('systemAdmin', 'System Administration')}</h2>
        <p>{t('systemAdminDesc', 'Manage system configuration, sync operations, and scheduled tasks')}</p>
      </div>
      <div className={styles.dashboardCards}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              className={styles.dashboardCard}
              href={item.path}
            >
              <div className={styles.cardIcon}>
                <Icon size={32} />
              </div>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <ChevronRight size={20} className={styles.cardArrow} />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
