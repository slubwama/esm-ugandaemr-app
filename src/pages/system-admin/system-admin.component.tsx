import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  QrCode,
  Location,
} from '@carbon/react/icons';
import styles from './system-admin.scss';

const SystemAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'sync-profiles',
      label: t('syncProfiles', 'Sync Profiles'),
      description: t('syncProfilesDesc', 'Configure and manage FHIR sync profiles'),
      icon: Connect,
      path: '/sync-profiles',
    },
    {
      id: 'sync-task-types',
      label: t('syncTaskTypes', 'Sync Task Types'),
      description: t('syncTaskTypesDesc', 'Manage sync task types and view execution history'),
      icon: Settings,
      path: '/sync-task-types',
    },
    {
      id: 'schedule-tasks',
      label: t('scheduleTaskManager', 'Schedule Task Manager'),
      description: t('scheduleTaskManagerDesc', 'Schedule and automate recurring tasks'),
      icon: Calendar,
      path: '/schedule-tasks',
    },
    {
      id: 'cohort-management',
      label: t('cohortManagement', 'Cohort Management'),
      description: t('cohortManagementDesc', 'Manage DSD refill groups and patient enrollment'),
      icon: Group,
      path: '/cohort-management',
    },
    {
      id: 'viral-load-upload',
      label: t('viralLoadUpload', 'Viral Load Upload'),
      description: t('viralLoadUploadDesc', 'Upload viral load test results from CPHL'),
      icon: Upload,
      path: '/viral-load-upload',
    },
    {
      id: 'sms-settings',
      label: t('sms', 'SMS'),
      description: t('smsDesc', 'Configure SMS gateway and view sent message logs'),
      icon: Mobile,
      path: '/sms-settings',
    },
    {
      id: 'system-upgrades',
      label: t('systemUpgrades', 'System Updates & Upgrades'),
      description: t('systemUpgradesDesc', 'Execute system upgrades and update EMR components'),
      icon: Renew,
      path: '/system-upgrades',
    },
    {
      id: 'about-systems',
      label: t('aboutSystems', 'About Systems'),
      description: t('aboutSystemsDesc', 'View system information, version details, and facility code'),
      icon: Information,
      path: '/about-systems',
    },
    {
      id: 'mobile-connection',
      label: t('mobileConnection', 'Mobile Connection'),
      description: t('mobileConnectionDesc', 'Connect your mobile device to access this system'),
      icon: QrCode,
      path: '/mobile-connection',
    },
    {
      id: 'location-management',
      label: t('locationManagement', 'Location Management'),
      description: t('locationManagementDesc', 'Manage and organize health center location hierarchy'),
      icon: Location,
      path: '/location-management',
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
            <button
              key={item.id}
              className={styles.dashboardCard}
              onClick={() => navigate(item.path)}
            >
              <div className={styles.cardIcon}>
                <Icon size={32} />
              </div>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <ChevronRight size={20} className={styles.cardArrow} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
