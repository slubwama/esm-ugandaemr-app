import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, Tab, TabList, TabPanels, TabPanel, Select, SelectItem, Tag, Tile } from '@carbon/react';
import { ErrorState } from '@openmrs/esm-framework';
import {
  useSyncFhirProfiles,
  useSyncFhirCases,
  useSyncFhirResources,
  useSyncFhirProfileLogs,
} from './sync-profile-statistics.resources';
import { type SyncFhirCase, type SyncFhirResource, type SyncFhirProfileLog } from './sync-profile-statistics.types';
import SystemAdminDataTable from '../shared-components/data-table';
import styles from './sync-profiles.scss';

const SyncProfileStatistics: React.FC = () => {
  const { t } = useTranslation();
  const { profiles, isLoading: profilesLoading, isError: profilesError } = useSyncFhirProfiles();
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { cases, isLoading: casesLoading, isError: casesError } = useSyncFhirCases(selectedProfile);
  const { resources, isLoading: resourcesLoading, isError: resourcesError } = useSyncFhirResources(selectedProfile);
  const { logs, isLoading: logsLoading, isError: logsError } = useSyncFhirProfileLogs(selectedProfile);

  const casesColumns = [
    { key: 'patient', header: t('patient', 'Patient') },
    { key: 'caseIdentifier', header: t('profileIdentifier', 'Profile Identifier') },
    { key: 'lastUpdated', header: t('lastUpdated', 'Last Updated') },
    { key: 'dateCreated', header: t('dateCreated', 'Date Created') },
  ];

  const renderCasesCell = (columnKey: string, row: SyncFhirCase) => {
    switch (columnKey) {
      case 'patient':
        return row.patient?.display || '-';
      case 'caseIdentifier':
        return row.caseIdentifier || '-';
      case 'lastUpdated':
        return row.lastUpdateDate ? new Date(row.lastUpdateDate).toLocaleString() : '-';
      case 'dateCreated':
        return row.dateCreated ? new Date(row.dateCreated).toLocaleString() : '-';
      default:
        return null;
    }
  };

  const resourcesColumns = [
    { key: 'resourceId', header: t('resourceId', 'Resource ID') },
    { key: 'dateCreated', header: t('dateCreated', 'Date Created') },
    { key: 'synced', header: t('syncedToServer', 'Synced to Server') },
    { key: 'syncedDate', header: t('syncedDate', 'Synced Date') },
    { key: 'expiryDate', header: t('purgeDate', 'Purge Date') },
    { key: 'statusCode', header: t('statusCode', 'Status Code') },
    { key: 'statusMessage', header: t('statusMessage', 'Status Message') },
  ];

  const renderResourcesCell = (columnKey: string, row: SyncFhirResource) => {
    switch (columnKey) {
      case 'resourceId':
        return row.uuid || '-';
      case 'dateCreated':
        return row.dateCreated ? new Date(row.dateCreated).toLocaleString() : '-';
      case 'synced':
        return row.synced ? (
          <Tag type="green">{t('yes', 'Yes')}</Tag>
        ) : (
          <Tag type="red">{t('no', 'No')}</Tag>
        );
      case 'syncedDate':
        return row.dateSynced ? new Date(row.dateSynced).toLocaleString() : '-';
      case 'expiryDate':
        return row.expiryDate ? new Date(row.expiryDate).toLocaleString() : '-';
      case 'statusCode':
        return row.statusCode || '-';
      case 'statusMessage':
        return row.statusCodeDetail || '-';
      default:
        return null;
    }
  };

  const logsColumns = [
    { key: 'resource', header: t('resource', 'Resource') },
    { key: 'lastSyncDate', header: t('lastSyncDate', 'Last Sync Date') },
    { key: 'numberOfResources', header: t('numberOfResources', 'No. of Resources') },
  ];

  const renderLogsCell = (columnKey: string, row: SyncFhirProfileLog) => {
    switch (columnKey) {
      case 'resource':
        return row.resourceType || '-';
      case 'lastSyncDate':
        return row.lastGenerationDate ? new Date(row.lastGenerationDate).toLocaleString() : '-';
      case 'numberOfResources':
        return row.numberOfResources ?? '-';
      default:
        return null;
    }
  };

  if (profilesError) {
    return (
      <ErrorState
        headerTitle={t('errorLoadingProfiles', 'Error loading profiles')}
        error={new Error(t('failedToLoadProfiles', 'Failed to load profiles'))}
      />
    );
  }

  return (
    <div className={styles.profileStatisticsContent}>
      {!selectedProfile ? (
        <div className={styles.profileSelectorContainer}>
          <Select
            id="sync-profile-select"
            labelText={t('selectSyncProfile', 'Select Sync FHIR Profile')}
            value={selectedProfile}
            onChange={(event) => setSelectedProfile(event.target.value)}
            disabled={profilesLoading}
          >
            <SelectItem value="" text={t('selectProfile', 'Select a profile')}>
              {t('selectProfile', 'Select a profile')}
            </SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.uuid} value={profile.uuid} text={profile.name}>
                {profile.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      ) : (
        <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}>
          <div className={styles.tabsHeader}>
            <TabList aria-label="Sync profile statistics tabs">
              <Tab>{t('patientsInExchangeProfile', 'Patient in the Exchange Profile')}</Tab>
              <Tab>{t('resources', 'Resources')}</Tab>
              <Tab>{t('profileLogs', 'Profile Logs')}</Tab>
            </TabList>
            <Select
              id="sync-profile-select"
              labelText={t('selectSyncProfile', 'Select Sync FHIR Profile')}
              value={selectedProfile}
              onChange={(event) => setSelectedProfile(event.target.value)}
              disabled={profilesLoading}
              className={styles.profileSelectInTabs}
            >
              <SelectItem value="" text={t('selectProfile', 'Select a profile')}>
                {t('selectProfile', 'Select a profile')}
              </SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.uuid} value={profile.uuid} text={profile.name}>
                  {profile.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <TabPanels>
            <TabPanel>
              <SystemAdminDataTable
                columns={casesColumns}
                data={cases}
                isLoading={casesLoading}
                error={casesError ? t('errorLoadingCases', 'Error loading cases') : null}
                searchPlaceholder={t('searchCases', 'Search cases...')}
                emptyState={{
                  title: t('noCasesFound', 'No Patient Cases'),
                  description: t('noCasesFoundDesc', 'No patient cases found for this profile'),
                }}
                renderCell={renderCasesCell}
              />
            </TabPanel>
            <TabPanel>
              <SystemAdminDataTable
                columns={resourcesColumns}
                data={resources}
                isLoading={resourcesLoading}
                error={resourcesError ? t('errorLoadingResources', 'Error loading resources') : null}
                searchPlaceholder={t('searchResources', 'Search resources...')}
                emptyState={{
                  title: t('noResourcesFound', 'No Resources'),
                  description: t('noResourcesFoundDesc', 'No resources found for this profile'),
                }}
                renderCell={renderResourcesCell}
              />
            </TabPanel>
            <TabPanel>
              <SystemAdminDataTable
                columns={logsColumns}
                data={logs}
                isLoading={logsLoading}
                error={logsError ? t('errorLoadingLogs', 'Error loading profile logs') : null}
                searchPlaceholder={t('searchLogs', 'Search logs...')}
                emptyState={{
                  title: t('noLogsFound', 'No Profile Logs'),
                  description: t('noLogsFoundDesc', 'No profile logs found for this profile'),
                }}
                renderCell={renderLogsCell}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </div>
  );
};

export default SyncProfileStatistics;
