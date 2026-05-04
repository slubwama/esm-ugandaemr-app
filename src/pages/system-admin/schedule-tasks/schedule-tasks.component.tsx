import React, { useState, useMemo, useCallback } from 'react';
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
  OverflowMenuItem,
  Tag,
  Pagination,
} from '@carbon/react';
import {
  Calendar,
} from '@carbon/react/icons';
import {
  ErrorState,
  showNotification,
  showSnackbar,
  usePagination,
} from '@openmrs/esm-framework';
import {
  useScheduledTasks,
  runTaskNow,
} from './schedule-tasks.resources';
import { type ScheduledTask } from './schedule-tasks.types';
import styles from './schedule-tasks.scss';

interface ScheduleTasksContentProps {
  // Add any props if needed
}

const ScheduleTasksContent: React.FC<ScheduleTasksContentProps> = () => {
  const { t } = useTranslation();
  const { tasks, isLoading, isError, mutate } = useScheduledTasks();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.name?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.taskClass?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // Pagination setup
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

  const {
    goTo,
    results: paginatedTasks,
    currentPage,
  } = usePagination(filteredTasks, currentPageSize);

  const formatRepeatInterval = useCallback((seconds: number) => {
    if (seconds === 0) return t('manual', 'Manual');
    if (seconds < 60) return t('everyXSeconds', 'Every {{seconds}}s', { seconds });
    if (seconds < 3600) return t('everyXMinutes', 'Every {{minutes}}m', { minutes: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('everyXHours', 'Every {{hours}}h', { hours: Math.floor(seconds / 3600) });
    return t('everyXDays', 'Every {{days}}d', { days: Math.floor(seconds / 86400) });
  }, [t]);

  const handleRunNow = useCallback(
    async (task: ScheduledTask) => {
      try {
        await runTaskNow(task.uuid);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('taskTriggered', 'Task triggered'),
          subtitle: t('taskTriggeredDesc', 'Task will run immediately'),
          autoClose: true,
        });
        mutate();
      } catch (error) {
        showNotification({
          title: t('errorTriggeringTask', 'Error triggering task'),
          kind: 'error',
          critical: true,
          description: error.message,
        });
      }
    },
    [t, mutate]
  );

  const getStatusTag = useCallback((task: ScheduledTask) => {
    if (task.started) {
      return <Tag type="green">{t('running', 'Running')}</Tag>;
    } else if (task.startOnStartup) {
      return <Tag type="blue">{t('autoStart', 'Auto-start')}</Tag>;
    } else {
      return <Tag type="gray">{t('stopped', 'Stopped')}</Tag>;
    }
  }, [t]);

  const tableHeaders = useMemo(
    () => [
      { key: 'name', header: t('taskName', 'Task Name') },
      { key: 'description', header: t('description', 'Description') },
      { key: 'schedule', header: t('schedule', 'Schedule') },
      { key: 'lastRun', header: t('lastRun', 'Last Run') },
      { key: 'status', header: t('status', 'Status') },
      { key: 'actions', header: t('actions', 'Actions') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      paginatedTasks.map((task) => ({
        id: task.uuid,
        name: task.name,
        description: task.description || '-',
        schedule: formatRepeatInterval(task.repeatInterval),
        lastRun: task.lastExecutionTime ? new Date(task.lastExecutionTime).toLocaleString() : '-',
        status: getStatusTag(task),
        actions: (
          <div className={styles.taskActions}>
            <OverflowMenuItem
              itemText={t('runNow', 'Run Now')}
              onClick={() => handleRunNow(task)}
              disabled={!task.started}
            />
          </div>
        ),
      })),
    [paginatedTasks, t, formatRepeatInterval, getStatusTag, handleRunNow]
  );

  if (isLoading) {
    return <DataTableSkeleton className={styles.tasksTable} />;
  }

  if (isError) {
    return (
      <ErrorState
        headerTitle={t('errorLoadingTasks', 'Error loading scheduled tasks')}
        error={new Error(t('failedToLoadTasks', 'Failed to load scheduled tasks'))}
      />
    );
  }

  return (
    <div className={styles.scheduleTasksContent}>
      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>{t('noScheduledTasks', 'No Scheduled Tasks')}</h3>
          <p className={styles.emptyStateDescription}>
            {t('noScheduledTasksDesc', 'No scheduled tasks found in the system')}
          </p>
        </div>
      ) : (
        <DataTable rows={tableRows} headers={tableHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer className={styles.tasksTable}>
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event ? event.toString() : '')}
                    placeholder={t('searchTasks', 'Search tasks...')}
                  />
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
                totalItems={filteredTasks.length}
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
    </div>
  );
};

export default ScheduleTasksContent;