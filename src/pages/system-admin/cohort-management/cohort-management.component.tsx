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
  Group,
  User,
} from '@carbon/react/icons';
import Illustration from './cohort-management-illustration.component';
import { Header } from '../shared-components';
import CohortRegistration from './cohort-registration.component';
import PatientExit from './patient-exit.component';
import styles from './cohort-management.scss';

interface CohortManagementProps {
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

const CohortManagement: React.FC<CohortManagementProps> = ({ backButton }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <>
      <Header
        illustrationComponent={<Illustration />}
        title={t('cohortManagement', 'Cohort Management')}
        backButton={backButton}
      />
      <div className={styles.cohortManagementWrapper}>
        <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}>
          <TabList aria-label="Cohort management tabs">
            <Tab>
              <Group className={styles.tabIcon} />
              {t('cohortRegistration', 'Cohort Registration')}
            </Tab>
            <Tab>
              <User className={styles.tabIcon} />
              {t('patientExit', 'Patient Exit')}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {selectedIndex === 0 && <CohortRegistration />}
            </TabPanel>
            <TabPanel>
              {selectedIndex === 1 && <PatientExit />}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </>
  );
};

export default CohortManagement;
