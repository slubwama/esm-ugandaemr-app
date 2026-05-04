import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Select,
  SelectItem,
  DataTable,
  DataTableSkeleton,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  Tag,
  Tile,
} from '@carbon/react';
import {
  ErrorState,
  usePagination,
} from '@openmrs/esm-framework';
import {
  useSyncFhirProfiles,
  useSyncFhirCases,
  useSyncFhirResources,
  useSyncFhirProfileLogs,
} from './sync-profile-statistics.resources';
import { type SyncFhirCase, type SyncFhirResource, type SyncFhirProfileLog } from './sync-profile-statistics.types';
import styles from './sync-profiles.scss';

const SyncProfileStatistics: React.FC = () => {
  const { t } = useTranslation();
  const { profiles, isLoading: profilesLoading, isError: profilesError } = useSyncFhirProfiles();
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { cases, isLoading: casesLoading, isError: casesError } = useSyncFhirCases(selectedProfile);
  const { resources, isLoading: resourcesLoading, isError: resourcesError } = useSyncFhirResources(selectedProfile);
  const { logs, isLoading: logsLoading, isError: logsError } = useSyncFhirProfileLogs(selectedProfile);

  const pageSize = 10;
  const {
    goTo: goToCases,
    results: paginatedCases,
    currentPage: currentPageCases,
  } = usePagination(cases, pageSize);

  const {
    goTo: goToResources,
    results: paginatedResources,
    currentPage: currentPageResources,
  } = usePagination(resources, pageSize);

  const {
    goTo: goToLogs,
    results: paginatedLogs,
    currentPage: currentPageLogs,
  } = usePagination(logs, pageSize);

  const casesTableHeaders = useMemo(
    () => [
      { key: 'patient', header: t('patient', 'Patient') },
      { key: 'caseIdentifier', header: t('profileIdentifier', 'Profile Identifier') },
      { key: 'lastUpdated', header: t('lastUpdated', 'Last Updated') },
      { key: 'dateCreated', header: t('dateCreated', 'Date Created') },
    ],
    [t]
  );

  const casesTableRows = useMemo(
    () =>
      paginatedCases.map((caseItem) => {
        const caseData = caseItem as SyncFhirCase;
        return {
          id: caseData.uuid,
          patient: caseData.patient?.display || '-',
          caseIdentifier: caseData.caseIdentifier || '-',
          lastUpdated: caseData.lastUpdateDate ? new Date(caseData.lastUpdateDate).toLocaleString() : '-',
          dateCreated: caseData.dateCreated ? new Date(caseData.dateCreated).toLocaleString() : '-',
        };
      }),
    [paginatedCases]
  );

  const resourcesTableHeaders = useMemo(
    () => [
      { key: 'resourceId', header: t('resourceId', 'Resource ID') },
      { key: 'dateCreated', header: t('dateCreated', 'Date Created') },
      { key: 'synced', header: t('syncedToServer', 'Synced to Server') },
      { key: 'syncedDate', header: t('syncedDate', 'Synced Date') },
      { key: 'expiryDate', header: t('purgeDate', 'Purge Date') },
      { key: 'statusCode', header: t('statusCode', 'Status Code') },
      { key: 'statusMessage', header: t('statusMessage', 'Status Message') },
    ],
    [t]
  );

  const resourcesTableRows = useMemo(
    () =>
      paginatedResources.map((resource) => {
        const resourceData = resource as SyncFhirResource;
        return {
          id: resourceData.uuid,
          resourceId: resourceData.uuid || '-',
          dateCreated: resourceData.dateCreated ? new Date(resourceData.dateCreated).toLocaleString() : '-',
          synced: resourceData.synced ? (
            <Tag type="green">{t('yes', 'Yes')}</Tag>
          ) : (
            <Tag type="red">{t('no', 'No')}</Tag>
          ),
          syncedDate: resourceData.dateSynced ? new Date(resourceData.dateSynced).toLocaleString() : '-',
          expiryDate: resourceData.expiryDate ? new Date(resourceData.expiryDate).toLocaleString() : '-',
          statusCode: resourceData.statusCode || '-',
          statusMessage: resourceData.statusCodeDetail || '-',
        };
      }),
    [paginatedResources, t]
  );

  const logsTableHeaders = useMemo(
    () => [
      { key: 'resource', header: t('resource', 'Resource') },
      { key: 'lastSyncDate', header: t('lastSyncDate', 'Last Sync Date') },
      { key: 'numberOfResources', header: t('numberOfResources', 'No. of Resources') },
    ],
    [t]
  );

  const logsTableRows = useMemo(
    () =>
      paginatedLogs.map((log) => {
        const logData = log as SyncFhirProfileLog;
        return {
          id: logData.uuid,
          resource: logData.resourceType || '-',
          lastSyncDate: logData.lastGenerationDate ? new Date(logData.lastGenerationDate).toLocaleString() : '-',
          numberOfResources: logData.numberOfResources ?? '-',
        };
      }),
    [paginatedLogs]
  );

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

      {!selectedProfile ? (
        <Tile className={styles.emptyState}>
          <p>{t('selectProfileToViewStats', 'Select a profile to view its statistics')}</p>
        </Tile>
      ) : (
        <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}>
          <TabList aria-label="Sync profile statistics tabs">
            <Tab>{t('patientsInExchangeProfile', 'Patient in the Exchange Profile')}</Tab>
            <Tab>{t('resources', 'Resources')}</Tab>
            <Tab>{t('profileLogs', 'Profile Logs')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {casesLoading ? (
                <DataTableSkeleton />
              ) : casesError ? (
                <ErrorState
                  headerTitle={t('errorLoadingCases', 'Error loading cases')}
                  error={new Error(t('failedToLoadCases', 'Failed to load cases'))}
                />
              ) : cases.length === 0 ? (
                <Tile className={styles.emptyState}>
                  <p>{t('noCasesFound', 'No patient cases found for this profile')}</p>
                </Tile>
              ) : (
                <DataTable rows={casesTableRows} headers={casesTableHeaders}>
                  {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                    <TableContainer>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map((header) => (
                              <TableHeader key={header.key} {...getHeaderProps({ header })}>
                                {header.header}
                              </TableHeader>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={row.id} {...getRowProps({ row })}>
                              {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DataTable>
              )}
            </TabPanel>
            <TabPanel>
              {resourcesLoading ? (
                <DataTableSkeleton />
              ) : resourcesError ? (
                <ErrorState
                  headerTitle={t('errorLoadingResources', 'Error loading resources')}
                  error={new Error(t('failedToLoadResources', 'Failed to load resources'))}
                />
              ) : resources.length === 0 ? (
                <Tile className={styles.emptyState}>
                  <p>{t('noResourcesFound', 'No resources found for this profile')}</p>
                </Tile>
              ) : (
                <DataTable rows={resourcesTableRows} headers={resourcesTableHeaders}>
                  {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                    <TableContainer>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map((header) => (
                              <TableHeader key={header.key} {...getHeaderProps({ header })}>
                                {header.header}
                              </TableHeader>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={row.id} {...getRowProps({ row })}>
                              {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DataTable>
              )}
            </TabPanel>
            <TabPanel>
              {logsLoading ? (
                <DataTableSkeleton />
              ) : logsError ? (
                <ErrorState
                  headerTitle={t('errorLoadingLogs', 'Error loading profile logs')}
                  error={new Error(t('failedToLoadLogs', 'Failed to load profile logs'))}
                />
              ) : logs.length === 0 ? (
                <Tile className={styles.emptyState}>
                  <p>{t('noLogsFound', 'No profile logs found for this profile')}</p>
                </Tile>
              ) : (
                <DataTable rows={logsTableRows} headers={logsTableHeaders}>
                  {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                    <TableContainer>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map((header) => (
                              <TableHeader key={header.key} {...getHeaderProps({ header })}>
                                {header.header}
                              </TableHeader>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={row.id} {...getRowProps({ row })}>
                              {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DataTable>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </div>
  );
};

export default SyncProfileStatistics;
