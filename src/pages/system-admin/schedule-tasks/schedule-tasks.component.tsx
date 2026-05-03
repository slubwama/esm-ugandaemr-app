import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
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
  Tag,
} from '@carbon/react';
import {
  Add,
  Calendar,
  Checkmark,
  Warning,
  Time,
  Restart,
} from '@carbon/react/icons';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import styles from './schedule-tasks.scss';

interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  lastRun?: string;
  nextRun?: string;
  lastStatus: 'success' | 'failed' | 'pending';
}

interface ScheduleTasksContentProps {
  // Add any props if needed
}

const ScheduleTasksContent: React.FC<ScheduleTasksContentProps> = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder data - in real implementation, this would come from backend
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    {
      id: '1',
      name: 'Daily Data Sync',
      description: 'Sync patient data to central server',
      schedule: '0 2 * * *',
      status: 'active',
      lastRun: '2026-05-03 02:00',
      nextRun: '2026-05-04 02:00',
      lastStatus: 'success',
    },
    {
      id: '2',
      name: 'Weekly Backup',
      description: 'Backup database',
      schedule: '0 3 * * 0',
      status: 'active',
      lastRun: '2026-05-02 03:00',
      nextRun: '2026-05-09 03:00',
      lastStatus: 'success',
    },
    {
      id: '3',
      name: 'Hourly Cache Cleanup',
      description: 'Clean up expired cache entries',
      schedule: '0 * * * *',
      status: 'paused',
      lastRun: '2026-05-03 10:00',
      nextRun: 'N/A',
      lastStatus: 'success',
    },
  ]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return scheduledTasks;
    const query = searchQuery.toLowerCase();
    return scheduledTasks.filter(
      (task) =>
        task.name?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    );
  }, [scheduledTasks, searchQuery]);

  const handleToggleTaskStatus = (taskId: string) => {
    setScheduledTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'active' ? 'paused' : 'active' }
          : task
      )
    );
    showSnackbar({
      isLowContrast: true,
      kind: 'success',
      title: t('taskStatusUpdated', 'Task status updated'),
      autoClose: true,
    });
  };

  const handleRunNow = (taskId: string) => {
    showSnackbar({
      isLowContrast: true,
      kind: 'success',
      title: t('taskTriggered', 'Task triggered'),
      subtitle: t('taskTriggeredDesc', 'Task will run immediately'),
      autoClose: true,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setScheduledTasks((prev) => prev.filter((task) => task.id !== taskId));
    showSnackbar({
      isLowContrast: true,
      kind: 'success',
      title: t('taskDeleted', 'Task deleted'),
      autoClose: true,
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag type="green">{t('active', 'Active')}</Tag>;
      case 'paused':
        return <Tag type="gray">{t('paused', 'Paused')}</Tag>;
      case 'completed':
        return <Tag type="blue">{t('completed', 'Completed')}</Tag>;
      case 'failed':
        return <Tag type="red">{t('failed', 'Failed')}</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getLastStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Checkmark size={16} className={styles.statusSuccess} />;
      case 'failed':
        return <Warning size={16} className={styles.statusFailed} />;
      default:
        return <Time size={16} className={styles.statusPending} />;
    }
  };

  const tableHeaders = useMemo(
    () => [
      { key: 'name', header: t('taskName', 'Task Name') },
      { key: 'schedule', header: t('schedule', 'Schedule') },
      { key: 'lastRun', header: t('lastRun', 'Last Run') },
      { key: 'nextRun', header: t('nextRun', 'Next Run') },
      { key: 'lastStatus', header: t('lastStatus', 'Last Status') },
      { key: 'status', header: t('status', 'Status') },
      { key: 'actions', header: t('actions', 'Actions') },
    ],
    [t]
  );

  const tableRows = useMemo(
    () =>
      filteredTasks.map((task) => ({
        id: task.id,
        name: task.name,
        schedule: task.schedule,
        lastRun: task.lastRun || '-',
        nextRun: task.nextRun || '-',
        lastStatus: (
          <div className={styles.statusWithIcon}>
            {getLastStatusIcon(task.lastStatus)}
            <span>{t(task.lastStatus, task.lastStatus)}</span>
          </div>
        ),
        status: getStatusTag(task.status),
        actions: (
          <div className={styles.taskActions}>
            <OverflowMenuItem
              itemText={t('runNow', 'Run Now')}
              onClick={() => handleRunNow(task.id)}
            />
            <OverflowMenuItem
              itemText={task.status === 'active' ? t('pause', 'Pause') : t('resume', 'Resume')}
              onClick={() => handleToggleTaskStatus(task.id)}
            />
            <OverflowMenuItem
              itemText={t('delete', 'Delete')}
              isDelete
              onClick={() => handleDeleteTask(task.id)}
            />
          </div>
        ),
      })),
    [filteredTasks, t]
  );

  return (
    <div className={styles.scheduleTasksContent}>
      {scheduledTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>{t('noScheduledTasks', 'No Scheduled Tasks')}</h3>
          <p className={styles.emptyStateDescription}>
            {t('noScheduledTasksDesc', 'Create your first scheduled task to get started')}
          </p>
          <Button kind="primary" renderIcon={Add}>
            {t('createFirstTask', 'Create First Task')}
          </Button>
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
                  <Button
                    kind="primary"
                    renderIcon={Add}
                    hasIconOnly
                    iconDescription={t('addScheduledTask', 'Add Scheduled Task')}
                    tooltipAlignment="end"
                  >
                    {t('addScheduledTask', 'Add Scheduled Task')}
                  </Button>
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
            </TableContainer>
          )}
        </DataTable>
      )}
    </div>
  );
};

export default ScheduleTasksContent;
