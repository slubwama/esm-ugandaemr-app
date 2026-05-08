import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem } from '@carbon/react';
import { Add, Export, Settings } from '@carbon/react/icons';
import { ErrorState, UserHasAccess, showNotification, showSnackbar } from '@openmrs/esm-framework';
import {
  useSyncTaskTypes,
  deleteSyncTaskType,
  runTaskByName,
  exportTaskTypes,
} from './sync-task-types.resources';
import { type SyncTaskType } from './sync-task-types.types';
import TaskTypeDetailModal from './tasktype-detail-modal.component';
import Illustration from './sync-task-types-illustration.component';
import { Header } from '../shared-components';
import SystemAdminDataTable from '../shared-components/data-table';
import styles from './sync-task-types.scss';

interface SyncTaskTypesContentProps {
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

const SyncTaskTypesContent: React.FC<SyncTaskTypesContentProps> = ({ backButton }) => {
  const { t } = useTranslation();
  const { taskTypes, isLoading, isError, mutate } = useSyncTaskTypes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<SyncTaskType | undefined>();

  const handleCreateTaskType = useCallback(() => {
    setSelectedTaskType(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditTaskType = useCallback((taskType: SyncTaskType) => {
    setSelectedTaskType(taskType);
    setIsModalOpen(true);
  }, []);

  const handleDeleteTaskType = useCallback(
    async (taskType: SyncTaskType) => {
      try {
        await deleteSyncTaskType(taskType.uuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('taskTypeDeleted', 'Task Type deleted'),
          subtitle: t('taskTypeDeletedSuccess', 'Sync task type has been deleted successfully'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorDeletingTaskType', 'Error deleting task type'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, mutate]
  );

  const handleExecuteTask = useCallback(
    async (taskType: SyncTaskType) => {
      try {
        await runTaskByName(taskType.name);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('taskExecuted', 'Task executed'),
          subtitle: t('taskExecutedSuccess', 'Task has been executed successfully'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorExecutingTask', 'Error executing task'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, mutate]
  );

  const handleExportTaskTypes = useCallback(async () => {
    try {
      await exportTaskTypes();
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('taskTypesExported', 'Task Types exported'),
        subtitle: t('taskTypesExportedSuccess', 'Sync task types have been exported successfully'),
        autoClose: true,
      });
    } catch (error) {
      showNotification({
        title: t('errorExportingTaskTypes', 'Error exporting task types'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    }
  }, [t]);

  const columns = [
    { key: 'name', header: t('taskName', 'Task Name') },
    { key: 'dataType', header: t('dataType', 'Data Type') },
    { key: 'url', header: t('url', 'URL') },
    { key: 'tokenType', header: t('tokenType', 'Token Type') },
    { key: 'actions', header: t('actions', 'Actions') },
  ];

  const renderCell = (columnKey: string, row: SyncTaskType) => {
    switch (columnKey) {
      case 'dataType':
        return row.dataType || '-';
      case 'url':
        return row.url ? (
          <span className={styles.truncatedText} title={row.url}>
            {row.url.length > 40 ? `${row.url.substring(0, 40)}...` : row.url}
          </span>
        ) : '-';
      case 'tokenType':
        return row.tokenType || '-';
      case 'actions':
        return (
          <div className={styles.taskActions}>
            <OverflowMenuItem
              itemText={t('execute', 'Execute')}
              onClick={() => handleExecuteTask(row)}
            />
            <OverflowMenuItem
              itemText={t('edit', 'Edit')}
              onClick={() => handleEditTaskType(row)}
            />
            <OverflowMenuItem
              itemText={t('delete', 'Delete')}
              isDelete
              onClick={() => handleDeleteTaskType(row)}
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
      onClick: handleExportTaskTypes,
      icon: Export,
      hasIconOnly: true,
      iconDescription: t('export', 'Export'),
      kind: 'ghost',
      disabled: taskTypes.length === 0,
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
    label: t('addTaskType', 'Add Task Type'),
    onClick: handleCreateTaskType,
    icon: Add,
    hasIconOnly: true,
    iconDescription: t('addTaskType', 'Add Task Type'),
    kind: 'primary',
  };

  return (
    <>
      <div className={styles.syncTaskTypesContent}>
        <SystemAdminDataTable
        columns={columns}
        data={taskTypes}
        isLoading={isLoading}
        error={isError ? t('errorLoadingTaskTypes', 'Error loading sync task types') : null}
        searchPlaceholder={t('searchTaskTypes', 'Search task types...')}
        emptyState={{
          title: t('noSyncTaskTypes', 'No Sync Task Types'),
          description: t('noSyncTaskTypesDesc', 'Create your first sync task type to get started'),
          icon: <Settings size={48} />,
        }}
        toolbarActions={[
          ...toolbarActions,
          ...(taskTypes.length > 0 ? [createButton] : []),
        ]}
        renderCell={renderCell}
      />

      <TaskTypeDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskType={selectedTaskType}
        onSave={() => mutate()}
      />
      </div>
    </>
  );
};

export default SyncTaskTypesContent;
