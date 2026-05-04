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
  Document,
} from '@carbon/react/icons';
import SMSSettingsContent from './sms-settings.component';
import SmsLogsContent from './sms-logs.component';
import styles from './sms-settings.scss';

interface SMSWrapperProps {
  // Add any props if needed
}

const SMSWrapper: React.FC<SMSWrapperProps> = () => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className={styles.smsSettingsWrapper}>
      <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}>
        <TabList aria-label="SMS management tabs">
          <Tab>
            <Settings className={styles.tabIcon} />
            {t('settings', 'Settings')}
          </Tab>
          <Tab>
            <Document className={styles.tabIcon} />
            {t('logs', 'Logs')}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SMSSettingsContent />
          </TabPanel>
          <TabPanel>
            {selectedIndex === 1 && <SmsLogsContent />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default SMSWrapper;
