import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  DataTableSkeleton,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  OverflowMenuItem,
  Toggle,
} from '@carbon/react';
import {
  Add,
  Export,
  Renew,
  Connect,
  Checkmark,
  Warning,
  Time,
} from '@carbon/react/icons';
import {
  ErrorState,
  UserHasAccess,
  showNotification,
  showSnackbar,
} from '@openmrs/esm-framework';
import {
  useSyncProfiles,
  deleteSyncProfile,
  toggleProfileStatus,
  triggerSync,
  exportProfiles,
} from './sync-profiles.resources';
import { SyncFhirProfile } from './sync-profiles.types';
import ProfileDetailModal from './profile-detail-modal.component';
import styles from './sync-profiles.scss';

interface SyncProfilesContentProps {
  // Add any props if needed
}

const SyncProfilesContent: React.FC<SyncProfilesContentProps> = () => {
  const { t } = useTranslation();
  const { profiles, isLoading, isError, mutate } = useSyncProfiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SyncFhirProfile | undefined>();
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());

  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    const query = searchQuery.toLowerCase();
    return profiles.filter(
      (profile) =>
        profile.name?.toLowerCase().includes(query) ||
        profile.description?.toLowerCase().includes(query) ||
        profile.serverUrl?.toLowerCase().includes(query)
    );
  }, [profiles, searchQuery]);

  const handleCreateProfile = useCallback(() => {
    setSelectedProfile(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditProfile = useCallback((profile: SyncFhirProfile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  }, []);

  const handleDeleteProfile = useCallback(
    async (profile: SyncFhirProfile) => {
      try {
        await deleteSyncProfile(profile.uuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('profileDeleted', 'Profile deleted'),
          subtitle: t('profileDeletedSuccess', 'Sync profile has been deleted successfully'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorDeletingProfile', 'Error deleting profile'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, mutate]
  );

  const handleToggleStatus = useCallback(
    async (profile: SyncFhirProfile, enabled: boolean) => {
      try {
        await toggleProfileStatus(profile.uuid, enabled);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('statusUpdated', 'Status updated'),
          subtitle: enabled
            ? t('profileEnabled', 'Profile enabled successfully')
            : t('profileDisabled', 'Profile disabled successfully'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorUpdatingStatus', 'Error updating status'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, mutate]
  );

  const handleTriggerSync = useCallback(
    async (profile: SyncFhirProfile) => {
      try {
        await triggerSync(profile.uuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('syncTriggered', 'Sync triggered'),
          subtitle: t('syncTriggeredSuccess', 'Sync operation has been triggered successfully'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorTriggeringSync', 'Error triggering sync'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, mutate]
  );

  const handleExportProfiles = useCallback(async () => {
    try {
      await exportProfiles();
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('profilesExported', 'Profiles exported'),
        subtitle: t('profilesExportedSuccess', 'Sync profiles have been exported successfully'),
        autoClose: true,
      });
    } catch (error) {
      showNotification({
        title: t('errorExportingProfiles', 'Error exporting profiles'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    }
  }, [t]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <Checkmark size={16} className={styles.statusSuccess} />;
      case 'failed':
        return <Warning size={16} className={styles.statusFailed} />;
      case 'in_progress':
        return <Renew size={16} className={styles.statusInProgress} />;
      default:
        return <Time size={16} className={styles.statusPending} />;
    }
  };

  const tableHeaders = useMemo(
    () => [
      {
        key: 'name',
        header: t('profileName', 'Profile Name'),
      },
      {
        key: 'serverUrl',
        header: t('serverUrl', 'Server URL'),
      },
      {
        key: 'lastSyncDate',
        header: t('lastSync', 'Last Sync'),
      },
      {
        key: 'syncStatus',
        header: t('status', 'Status'),
      },
      {
        key: 'profileEnabled',
        header: t('enabled', 'Enabled'),
      },
      {
        key: 'actions',
        header: t('actions', 'Actions'),
      },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      filteredProfiles.map((profile) => ({
        id: profile.uuid,
        name: profile.name || '-',
        serverUrl: profile.serverUrl || '-',
        lastSyncDate: profile.lastSyncDate
          ? new Date(profile.lastSyncDate).toLocaleString()
          : t('never', 'Never'),
        syncStatus: (
          <div className={`${styles.statusIndicator} ${styles['status_' + profile.syncStatus]}`}>
            {getStatusIcon(profile.syncStatus)}
            <span>{t(profile.syncStatus || 'unknown', profile.syncStatus || 'Unknown')}</span>
          </div>
        ),
        profileEnabled: (
          <Toggle
            id={`toggle-${profile.uuid}`}
            toggled={profile.profileEnabled}
            onToggle={(checked) => handleToggleStatus(profile, checked)}
            size="sm"
            labelA={t('off', 'Off')}
            labelB={t('on', 'On')}
          />
        ),
        actions: (
          <div className={styles.profileActions}>
            <OverflowMenuItem
              itemText={t('edit', 'Edit')}
              onClick={() => handleEditProfile(profile)}
            />
            <OverflowMenuItem
              itemText={t('syncNow', 'Sync Now')}
              onClick={() => handleTriggerSync(profile)}
            />
            <OverflowMenuItem
              itemText={t('delete', 'Delete')}
              isDelete
              onClick={() => handleDeleteProfile(profile)}
            />
          </div>
        ),
      })),
    [filteredProfiles, t, handleToggleStatus, handleEditProfile, handleTriggerSync, handleDeleteProfile]
  );

  if (isLoading) {
    return <DataTableSkeleton className={styles.syncTable} />;
  }

  if (isError) {
    return (
      <ErrorState
        headerTitle={t('errorLoadingProfiles', 'Error loading sync profiles')}
        error={new Error(t('failedToLoadProfiles', 'Failed to load sync profiles'))}
      />
    );
  }

  return (
    <div className={styles.syncProfilesContent}>
      {profiles.length === 0 ? (
        <div className={styles.emptyState}>
          <Connect size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>
            {t('noSyncProfiles', 'No Sync Profiles')}
          </h3>
          <p className={styles.emptyStateDescription}>
            {t('noSyncProfilesDesc', 'Create your first FHIR sync profile to get started')}
          </p>
          <UserHasAccess privilege="Manage FHIR Profiles">
            <Button kind="primary" onClick={handleCreateProfile} renderIcon={Add}>
              {t('createFirstProfile', 'Create First Profile')}
            </Button>
          </UserHasAccess>
        </div>
      ) : (
        <DataTable rows={tableRows} headers={tableHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer className={styles.syncTable}>
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event ? event.toString() : '')}
                    placeholder={t('searchProfiles', 'Search profiles...')}
                  />
                  <UserHasAccess privilege="Manage FHIR Profiles">
                    <Button
                      kind="secondary"
                      onClick={handleExportProfiles}
                      renderIcon={Export}
                      disabled={profiles.length === 0}
                      hasIconOnly
                      iconDescription={t('export', 'Export')}
                      tooltipAlignment="end"
                    >
                      {t('export', 'Export')}
                    </Button>
                    <Button
                      kind="primary"
                      onClick={handleCreateProfile}
                      renderIcon={Add}
                      hasIconOnly
                      iconDescription={t('addProfile', 'Add Profile')}
                      tooltipAlignment="end"
                    >
                      {t('addProfile', 'Add Profile')}
                    </Button>
                  </UserHasAccess>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })}>
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

      <ProfileDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={selectedProfile}
        onSave={() => mutate()}
      />
    </div>
  );
};

export default SyncProfilesContent;
