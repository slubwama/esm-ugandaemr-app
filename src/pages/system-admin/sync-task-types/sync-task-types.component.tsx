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
  Pagination,
} from '@carbon/react';
import {
  Add,
  Export,
  Play,
  Settings,
  Checkmark,
  Warning,
  Time,
} from '@carbon/react/icons';
import {
  ErrorState,
  UserHasAccess,
  showNotification,
  showSnackbar,
  usePagination,
} from '@openmrs/esm-framework';
import {
  useSyncTaskTypes,
  deleteSyncTaskType,
  toggleTaskTypeStatus,
  executeTaskType,
  exportTaskTypes,
} from './sync-task-types.resources';
import { type SyncTaskType } from './sync-task-types.types';
import TaskTypeDetailModal from './tasktype-detail-modal.component';
import styles from './sync-task-types.scss';

interface SyncTaskTypesContentProps {
  // Add any props if needed
}

const SyncTaskTypesContent: React.FC<SyncTaskTypesContentProps> = () => {
  const { t } = useTranslation();
  const { taskTypes, isLoading, isError, mutate } = useSyncTaskTypes();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<SyncTaskType | undefined>();

  const filteredTaskTypes = useMemo(() => {
    if (!searchQuery) return taskTypes;
    const query = searchQuery.toLowerCase();
    return taskTypes.filter(
      (taskType) =>
        taskType.name?.toLowerCase().includes(query) ||
        taskType.description?.toLowerCase().includes(query) ||
        taskType.taskType?.toLowerCase().includes(query)
    );
  }, [taskTypes, searchQuery]);

  // Pagination setup
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

  const {
    goTo,
    results: paginatedTaskTypes,
    currentPage,
  } = usePagination(filteredTaskTypes, currentPageSize);

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

  const handleToggleStatus = useCallback(
    async (taskType: SyncTaskType, enabled: boolean) => {
      try {
        await toggleTaskTypeStatus(taskType.uuid, enabled);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('statusUpdated', 'Status updated'),
          subtitle: enabled
            ? t('taskTypeEnabled', 'Task type enabled successfully')
            : t('taskTypeDisabled', 'Task type disabled successfully'),
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

  const handleExecuteTask = useCallback(
    async (taskType: SyncTaskType) => {
      try {
        await executeTaskType(taskType.uuid);
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <Checkmark size={16} className={styles.statusSuccess} />;
      case 'failed':
        return <Warning size={16} className={styles.statusFailed} />;
      case 'running':
        return <Play size={16} className={styles.statusRunning} />;
      default:
        return <Time size={16} className={styles.statusPending} />;
    }
  };

  const tableHeaders = useMemo(
    () => [
      { key: 'name', header: t('taskName', 'Task Name') },
      { key: 'taskType', header: t('taskType', 'Task Type') },
      { key: 'executionOrder', header: t('executionOrder', 'Order') },
      { key: 'lastExecutionDate', header: t('lastExecution', 'Last Execution') },
      { key: 'lastExecutionStatus', header: t('status', 'Status') },
      { key: 'taskEnabled', header: t('enabled', 'Enabled') },
      { key: 'actions', header: t('actions', 'Actions') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      paginatedTaskTypes.map((taskType) => ({
        id: taskType.uuid,
        name: taskType.name || '-',
        taskType: taskType.taskType || '-',
        executionOrder: taskType.executionOrder ?? 0,
        lastExecutionDate: taskType.lastExecutionDate
          ? new Date(taskType.lastExecutionDate).toLocaleString()
          : t('never', 'Never'),
        lastExecutionStatus: (
          <div className={`${styles.statusIndicator} ${styles['status_' + taskType.lastExecutionStatus]}`}>
            {getStatusIcon(taskType.lastExecutionStatus)}
            <span>{t(taskType.lastExecutionStatus || 'unknown', taskType.lastExecutionStatus || 'Unknown')}</span>
          </div>
        ),
        taskEnabled: (
          <Toggle
            id={`toggle-${taskType.uuid}`}
            toggled={taskType.taskEnabled}
            onToggle={(checked) => handleToggleStatus(taskType, checked)}
            size="sm"
            labelA={t('off', 'Off')}
            labelB={t('on', 'On')}
          />
        ),
        actions: (
          <div className={styles.taskActions}>
            <OverflowMenuItem
              itemText={t('execute', 'Execute')}
              onClick={() => handleExecuteTask(taskType)}
            />
            <OverflowMenuItem
              itemText={t('edit', 'Edit')}
              onClick={() => handleEditTaskType(taskType)}
            />
            <OverflowMenuItem
              itemText={t('delete', 'Delete')}
              isDelete
              onClick={() => handleDeleteTaskType(taskType)}
            />
          </div>
        ),
      })),
    [paginatedTaskTypes, t, handleToggleStatus, handleExecuteTask, handleEditTaskType, handleDeleteTaskType]
  );

  if (isLoading) {
    return <DataTableSkeleton className={styles.taskTypesTable} />;
  }

  if (isError) {
    return (
      <ErrorState
        headerTitle={t('errorLoadingTaskTypes', 'Error loading sync task types')}
        error={new Error(t('failedToLoadTaskTypes', 'Failed to load sync task types'))}
      />
    );
  }

  return (
    <div className={styles.syncTaskTypesContent}>
      {taskTypes.length === 0 ? (
        <div className={styles.emptyState}>
          <Settings size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>{t('noSyncTaskTypes', 'No Sync Task Types')}</h3>
          <p className={styles.emptyStateDescription}>
            {t('noSyncTaskTypesDesc', 'Create your first sync task type to get started')}
          </p>
          <UserHasAccess privilege="Manage Sync Task Types">
            <Button kind="primary" onClick={handleCreateTaskType} renderIcon={Add}>
              {t('createFirstTaskType', 'Create First Task Type')}
            </Button>
          </UserHasAccess>
        </div>
      ) : (
        <DataTable rows={tableRows} headers={tableHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer className={styles.taskTypesTable}>
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event ? event.toString() : '')}
                    placeholder={t('searchTaskTypes', 'Search task types...')}
                  />
                  <UserHasAccess privilege="Manage Sync Task Types">
                    <Button
                      kind="secondary"
                      onClick={handleExportTaskTypes}
                      renderIcon={Export}
                      disabled={taskTypes.length === 0}
                      hasIconOnly
                      iconDescription={t('export', 'Export')}
                      tooltipAlignment="end"
                    >
                      {t('export', 'Export')}
                    </Button>
                    <Button
                      kind="primary"
                      onClick={handleCreateTaskType}
                      renderIcon={Add}
                      hasIconOnly
                      iconDescription={t('addTaskType', 'Add Task Type')}
                      tooltipAlignment="end"
                    >
                      {t('addTaskType', 'Add Task Type')}
                    </Button>
                  </UserHasAccess>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
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
              <Pagination
                forwardText="Next page"
                backwardText="Previous page"
                page={currentPage}
                pageSize={currentPageSize}
                pageSizes={pageSizes}
                totalItems={filteredTaskTypes.length}
                className={styles.pagination}
                onChange={({ pageSize, page }) => {
                  if (pageSize !== currentPageSize) {
                    setPageSize(pageSize);
                  }
                  if (page !== currentPage) {
                    goTo(page);
                  }
                }}
              />
            </TableContainer>
          )}
        </DataTable>
      )}

      <TaskTypeDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskType={selectedTaskType}
        onSave={() => mutate()}
      />
    </div>
  );
};

export default SyncTaskTypesContent;
