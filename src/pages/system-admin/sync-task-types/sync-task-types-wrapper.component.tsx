import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
} from '@carbon/react';
import {
  Settings,
  Activity,
} from '@carbon/react/icons';
import Illustration from './sync-task-types-illustration.component';
import { Header } from '../shared-components';
import SyncTaskTypesContent from './sync-task-types.component';
import SyncTasksInstances from './sync-tasks-instances.component';
import styles from './sync-task-types.scss';

interface SyncTaskTypesWrapperProps {
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

const SyncTaskTypesWrapper: React.FC<SyncTaskTypesWrapperProps> = ({ backButton }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <>
      <Header
        illustrationComponent={<Illustration />}
        title={t('syncTaskTypes', 'Sync Task Types')}
        backButton={backButton}
      />
      <div className={styles.syncTaskTypesWrapper}>
        <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}>
          <TabList aria-label="Sync task management tabs">
            <Tab>
              <Settings className={styles.tabIcon} />
              {t('syncTaskTypes', 'Sync Task Types')}
            </Tab>
            <Tab>
              <Activity className={styles.tabIcon} />
              {t('syncTaskHistory', 'Sync Task History')}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SyncTaskTypesContent />
            </TabPanel>
            <TabPanel>
              <SyncTasksInstances />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </>
  );
};

export default SyncTaskTypesWrapper;