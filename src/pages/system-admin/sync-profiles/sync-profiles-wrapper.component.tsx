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
  Connect,
  Activity,
} from '@carbon/react/icons';
import SyncProfilesContent from './sync-profiles.component';
import SyncProfileStatistics from './sync-profile-statistics.component';
import styles from './sync-profiles.scss';

interface SyncProfilesWrapperProps {
  // Add any props if needed
}

const SyncProfilesWrapper: React.FC<SyncProfilesWrapperProps> = () => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className={styles.syncProfilesWrapper}>
      <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}>
        <TabList aria-label="Sync profile management tabs">
          <Tab>
            <Connect className={styles.tabIcon} />
            {t('syncProfiles', 'Sync Profiles')}
          </Tab>
          <Tab>
            <Activity className={styles.tabIcon} />
            {t('profileStatistics', 'Profile Statistics')}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SyncProfilesContent />
          </TabPanel>
          <TabPanel>
            <SyncProfileStatistics />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default SyncProfilesWrapper;
