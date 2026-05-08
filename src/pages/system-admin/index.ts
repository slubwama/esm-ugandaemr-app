import { getSyncLifecycle } from '@openmrs/esm-framework';
import { createLeftPanelLink } from './left-panel-link.component';
import {
  Dashboard,
  Connect,
  Settings,
  Calendar,
  Group,
  Upload,
  Mobile,
  Renew,
  Information,
} from '@carbon/react/icons';

const moduleName = '@ugandaemr/esm-ugandaemr-app';

const options = {
  featureName: 'system-admin',
  moduleName,
};

export const systemAdminDashboardLink = getSyncLifecycle(
  createLeftPanelLink({
    name: '',
    title: 'Dashboard',
    icon: Dashboard,
  }),
  options
);

export const syncProfilesLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'sync-profiles',
    title: 'Sync Profiles',
    icon: Connect,
  }),
  options
);

export const syncTaskTypesLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'sync-task-types',
    title: 'Sync Task Types',
    icon: Settings,
  }),
  options
);

export const scheduleTasksLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'schedule-tasks',
    title: 'Schedule Task Manager',
    icon: Calendar,
  }),
  options
);

export const cohortManagementLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'cohort-management',
    title: 'Cohort Management',
    icon: Group,
  }),
  options
);

export const viralLoadUploadLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'viral-load-upload',
    title: 'Viral Load Upload',
    icon: Upload,
  }),
  options
);

export const smsSettingsLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'sms-settings',
    title: 'SMS',
    icon: Mobile,
  }),
  options
);

export const systemUpgradesLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'system-upgrades',
    title: 'System Updates & Upgrades',
    icon: Renew,
  }),
  options
);

export const aboutSystemsLink = getSyncLifecycle(
  createLeftPanelLink({
    name: 'about-systems',
    title: 'About Systems',
    icon: Information,
  }),
  options
);

export * from './sync-logs';
export * from './sms-settings';
export * from './viral-load-upload';
export * from './about-systems';
