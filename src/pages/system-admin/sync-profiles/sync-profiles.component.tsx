import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem, Toggle } from '@carbon/react';
import { Add, Export, Connect } from '@carbon/react/icons';
import { ErrorState, UserHasAccess, showNotification, showSnackbar } from '@openmrs/esm-framework';
import {
  useSyncProfiles,
  deleteSyncProfile,
  toggleProfileStatus,
  triggerSync,
  exportProfiles,
  usePatientIdentifierTypes,
} from './sync-profiles.resources';
import { type SyncFhirProfile } from './sync-profiles.types';
import ProfileDetailModal from './profile-detail-modal.component';
import SystemAdminDataTable from '../shared-components/data-table';
import styles from './sync-profiles.scss';

const SyncProfilesContent: React.FC = () => {
  const { t } = useTranslation();
  const { profiles, isLoading, isError, mutate } = useSyncProfiles();
  const { patientIdentifierTypes } = usePatientIdentifierTypes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SyncFhirProfile | undefined>();

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
        return <span className={styles.statusSuccess}>✓</span>;
      case 'failed':
        return <span className={styles.statusFailed}>⚠</span>;
      case 'in_progress':
        return <span className={styles.statusInProgress}>↻</span>;
      default:
        return <span className={styles.statusPending}>·</span>;
    }
  };

  const columns = [
    { key: 'name', header: t('profileName', 'Profile Name') },
    { key: 'serverUrl', header: t('serverUrl', 'Server URL') },
    { key: 'lastSyncDate', header: t('lastSync', 'Last Sync') },
    { key: 'syncStatus', header: t('status', 'Status') },
    { key: 'profileEnabled', header: t('enabled', 'Enabled') },
    { key: 'actions', header: t('actions', 'Actions') },
  ];

  const renderCell = (columnKey: string, row: SyncFhirProfile) => {
    switch (columnKey) {
      case 'serverUrl':
        return row.serverUrl || '-';
      case 'lastSyncDate':
        return row.lastSyncDate
          ? new Date(row.lastSyncDate).toLocaleString()
          : t('never', 'Never');
      case 'syncStatus':
        return (
          <div className={`${styles.statusIndicator} ${styles['status_' + row.syncStatus]}`}>
            {getStatusIcon(row.syncStatus)}
            <span>{t(row.syncStatus || 'unknown', row.syncStatus || 'Unknown')}</span>
          </div>
        );
      case 'profileEnabled':
        return (
          <Toggle
            id={`toggle-${row.uuid}`}
            toggled={row.profileEnabled}
            onToggle={(checked) => handleToggleStatus(row, checked)}
            size="sm"
            labelA={t('off', 'Off')}
            labelB={t('on', 'On')}
          />
        );
      case 'actions':
        return (
          <div className={styles.profileActions}>
            <OverflowMenuItem
              itemText={t('edit', 'Edit')}
              onClick={() => handleEditProfile(row)}
            />
            <OverflowMenuItem
              itemText={t('syncNow', 'Sync Now')}
              onClick={() => handleTriggerSync(row)}
            />
            <OverflowMenuItem
              itemText={t('delete', 'Delete')}
              isDelete
              onClick={() => handleDeleteProfile(row)}
            />
          </div>
        );
      default:
        return row[columnKey];
    }
  };

  const toolbarActions: Array<{
    label: string;
    onClick: () => Promise<void>;
    icon: typeof Export;
    hasIconOnly: true;
    iconDescription: string;
    kind: 'ghost';
    disabled: boolean;
  }> = [
    {
      label: t('export', 'Export'),
      onClick: handleExportProfiles,
      icon: Export,
      hasIconOnly: true,
      iconDescription: t('export', 'Export'),
      kind: 'ghost',
      disabled: profiles.length === 0,
    },
  ];

  const createButton: {
    label: string;
    onClick: () => void;
    icon: typeof Add;
    hasIconOnly: true;
    iconDescription: string;
    kind: 'primary';
  } = {
    label: t('addProfile', 'Add Profile'),
    onClick: handleCreateProfile,
    icon: Add,
    hasIconOnly: true,
    iconDescription: t('addProfile', 'Add Profile'),
    kind: 'primary',
  };

  return (
    <div className={styles.syncProfilesContent}>
      <SystemAdminDataTable
        columns={columns}
        data={profiles}
        isLoading={isLoading}
        error={isError ? t('errorLoadingProfiles', 'Error loading sync profiles') : null}
        searchPlaceholder={t('searchProfiles', 'Search profiles...')}
        emptyState={{
          title: t('noSyncProfiles', 'No Sync Profiles'),
          description: t('noSyncProfilesDesc', 'Create your first FHIR sync profile to get started'),
          icon: <Connect size={48} />,
        }}
        toolbarActions={[
          ...toolbarActions,
          ...(profiles.length > 0 ? [createButton] : []),
        ]}
        renderCell={renderCell}
      />

      <ProfileDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={selectedProfile}
        onSave={() => mutate()}
        patientIdentifierTypes={patientIdentifierTypes}
      />
    </div>
  );
};

export default SyncProfilesContent;
