import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem, Tag } from '@carbon/react';
import { Calendar } from '@carbon/react/icons';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import { useScheduledTasks, runTaskNow } from './schedule-tasks.resources';
import { type ScheduledTask } from './schedule-tasks.types';
import Illustration from './schedule-tasks-illustration.component';
import { Header } from '../shared-components';
import SystemAdminDataTable from '../shared-components/data-table';
import styles from './schedule-tasks.scss';

interface ScheduleTasksContentProps {
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

const ScheduleTasksContent: React.FC<ScheduleTasksContentProps> = ({ backButton }) => {
  const { t } = useTranslation();
  const { tasks, isLoading, isError, mutate } = useScheduledTasks();

  const handleRunNow = useCallback(
    async (task: ScheduledTask, event?: React.MouseEvent | React.KeyboardEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      try {
        await runTaskNow(task.name);
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

  const formatRepeatInterval = (seconds: number) => {
    if (seconds === 0) return t('manual', 'Manual');
    if (seconds < 60) return t('everyXSeconds', 'Every {{seconds}}s', { seconds });
    if (seconds < 3600) return t('everyXMinutes', 'Every {{minutes}}m', { minutes: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('everyXHours', 'Every {{hours}}h', { hours: Math.floor(seconds / 3600) });
    return t('everyXDays', 'Every {{days}}d', { days: Math.floor(seconds / 86400) });
  };

  const getStatusTag = (task: ScheduledTask) => {
    if (task.started) {
      return <Tag type="green">{t('running', 'Running')}</Tag>;
    } else if (task.startOnStartup) {
      return <Tag type="blue">{t('autoStart', 'Auto-start')}</Tag>;
    }
    return <Tag type="gray">{t('stopped', 'Stopped')}</Tag>;
  };

  const columns = [
    { key: 'name', header: t('taskName', 'Task Name') },
    { key: 'description', header: t('description', 'Description') },
    { key: 'schedule', header: t('schedule', 'Schedule') },
    { key: 'lastRun', header: t('lastRun', 'Last Run') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'actions', header: t('actions', 'Actions') },
  ];

  const renderCell = (columnKey: string, row: ScheduledTask) => {
    switch (columnKey) {
      case 'description':
        return row.description || '-';
      case 'schedule':
        return formatRepeatInterval(row.repeatInterval);
      case 'lastRun':
        return row.lastExecutionTime ? new Date(row.lastExecutionTime).toLocaleString() : '-';
      case 'status':
        return getStatusTag(row);
      case 'actions':
        return (
          <div className={styles.taskActions}>
            <OverflowMenuItem
              itemText={t('runNow', 'Run Now')}
              onClick={(e) => handleRunNow(row, e)}
            />
          </div>
        );
      default:
        return row[columnKey];
    }
  };

  return (
    <>
      <Header
        illustrationComponent={<Illustration />}
        title={t('scheduleTaskManager', 'Schedule Task Manager')}
        backButton={backButton}
      />
      <div className={styles.scheduleTasksContent}>
        <SystemAdminDataTable
        columns={columns}
        data={tasks}
        isLoading={isLoading}
        error={isError ? t('errorLoadingTasks', 'Error loading scheduled tasks') : null}
        searchPlaceholder={t('searchTasks', 'Search tasks...')}
        emptyState={{
          title: t('noScheduledTasks', 'No Scheduled Tasks'),
          description: t('noScheduledTasksDesc', 'No scheduled tasks found in the system'),
          icon: <Calendar size={48} />,
        }}
        renderCell={renderCell}
      />
      </div>
    </>
  );
};

export default ScheduleTasksContent;
