import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { setLeftNav, unsetLeftNav } from '@openmrs/esm-framework';
import LeftPanel from './components/left-panel/left-panel.component';
import styles from './root.scss';
import SystemAdminDashboard from './system-admin.component';
import SyncProfilesContent from './sync-profiles';
import SyncTaskTypesContent from './sync-task-types';
import ScheduleTasksContent from './schedule-tasks/schedule-tasks.component';
import SMSSettingsContent from './sms-settings';
import ViralLoadUploadContent from './viral-load-upload/viral-load-upload.component';
import CohortManagementContent from './cohort-management';
import SystemUpgradesContent from './system-upgrades';
import AboutSystemsContent from './about-systems/about-systems.component';
import MobileConnectionContent from './mobile-connection';
import LocationManagementContent from './location-management';

const Root: React.FC = () => {
  const spaBasePath = window.spaBase;

  useEffect(() => {
    setLeftNav({
      name: 'system-admin-left-panel-slot',
      basePath: spaBasePath,
    });
    return () => unsetLeftNav('system-admin-left-panel-slot');
  }, [spaBasePath]);

  return (
    <BrowserRouter basename={`${window.getOpenmrsSpaBase()}system-admin`}>
      <LeftPanel />
      <main className={styles.container}>
        <Routes>
          <Route path="/" element={<SystemAdminDashboard />} />
          <Route path="/sync-profiles" element={<SyncProfilesContent />} />
          <Route path="/sync-task-types" element={<SyncTaskTypesContent />} />
          <Route path="/schedule-tasks" element={<ScheduleTasksContent />} />
          <Route path="/cohort-management" element={<CohortManagementContent />} />
          <Route path="/viral-load-upload" element={<ViralLoadUploadContent />} />
          <Route path="/sms-settings" element={<SMSSettingsContent />} />
          <Route path="/system-upgrades" element={<SystemUpgradesContent />} />
          <Route path="/about-systems" element={<AboutSystemsContent />} />
          <Route path="/mobile-connection" element={<MobileConnectionContent />} />
          <Route path="/location-management" element={<LocationManagementContent />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default Root;
