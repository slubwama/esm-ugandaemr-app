import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  InlineLoading,
  Tile,
  Tag,
} from '@carbon/react';
import { Play, Renew, Warning } from '@carbon/react/icons';
import { showNotification, showToast } from '@openmrs/esm-framework';
import { useUpgradeTasks } from './system-upgrades.resources';
import { type UpgradeTask } from './system-upgrades.types';
import styles from './system-upgrades.scss';

interface UpgradeTasksContentProps {}

const UpgradeTasksContent: React.FC<UpgradeTasksContentProps> = () => {
  const { t } = useTranslation();
  const { fetchUpgradeTasks, executeUpgradeTask } = useUpgradeTasks();

  const [tasks, setTasks] = useState<Array<UpgradeTask>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load tasks only once when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUpgradeTasks();
        setTasks(data);
      } catch (err) {
        setError(err.message);
        showNotification({
          title: t('errorLoadingUpgradeTasks', 'Error loading upgrade tasks'),
          kind: 'error',
          critical: true,
          description: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual refresh function for when user clicks refresh button
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUpgradeTasks();
      setTasks(data);
      showToast({
        title: t('refreshSuccess', 'Refresh Successful'),
        kind: 'success',
        description: t('tasksRefreshed', 'Upgrade tasks have been refreshed'),
      });
    } catch (err) {
      setError(err.message);
      showNotification({
        title: t('errorLoadingUpgradeTasks', 'Error loading upgrade tasks'),
        kind: 'error',
        critical: true,
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchUpgradeTasks, t]);

  const executeTask = useCallback(
    async (task: UpgradeTask) => {
      setExecutingTaskId(task.uuid);
      try {
        await executeUpgradeTask(task.name);
        showToast({
          critical: true,
          title: t('taskExecutionSuccess', 'Execution Successful'),
          kind: 'success',
          description: t('taskExecutedSuccessfully', 'Task {{name}} executed successfully', { name: task.name }),
        });
      } catch (err) {
        showNotification({
          title: t('taskExecutionFailed', 'Task Execution Failed'),
          kind: 'error',
          critical: true,
          description: err.message,
        });
      } finally {
        setExecutingTaskId(null);
      }
    },
    [executeUpgradeTask, t]
  );

  const getTaskIcon = (taskClass: string) => {
    if (taskClass.includes('UpgradeEnireEMRTask')) {
      return '🔄';
    } else if (taskClass.includes('UpdateFrontendTask')) {
      return '🎨';
    } else if (taskClass.includes('DownloadFormsAndConceptsTask')) {
      return '📥';
    } else if (taskClass.includes('initializeFormsAndMetaDataTask')) {
      return '🔧';
    }
    return '⚙️';
  };

  const getTaskPriority = (taskClass: string) => {
    if (taskClass.includes('UpgradeEnireEMRTask')) {
      return 'high';
    } else if (taskClass.includes('UpdateFrontendTask')) {
      return 'medium';
    }
    return 'low';
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className={styles.systemUpgradesContent}>
        <InlineLoading description={t('loadingUpgradeTasks', 'Loading upgrade tasks...')} />
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className={styles.systemUpgradesContent}>
        <div className={styles.errorState}>
          <Warning size={48} className={styles.errorIcon} />
          <h3>{t('errorLoadingTasks', 'Error Loading Tasks')}</h3>
          <p>{error}</p>
          <Button kind="tertiary" renderIcon={Renew} onClick={handleRefresh}>
            {t('retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.systemUpgradesContent}>
      <div className={styles.upgradeHeader}>
        <div className={styles.headerLeft}>
          <Renew size={48} className={styles.headerIcon} />
          <div>
            <h2 className={styles.pageTitle}>{t('systemUpgrade', 'System Upgrade')}</h2>
            <p className={styles.pageDescription}>
              {t(
                'systemUpgradeDescription',
                'Execute upgrade tasks to keep your EMR system up to date with the latest forms, concepts, and components'
              )}
            </p>
          </div>
        </div>
        <Button kind="tertiary" renderIcon={Renew} onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? t('loading', 'Loading...') : t('refresh', 'Refresh')}
        </Button>
      </div>

      <div className={styles.upgradeTasksGrid}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <Renew size={48} className={styles.emptyStateIcon} />
            <h3>{t('noUpgradeTasks', 'No Upgrade Tasks Available')}</h3>
            <p>{t('noUpgradeTasksDesc', 'No upgrade tasks are currently configured')}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <Tile key={task.uuid} className={styles.taskTile}>
              <div className={styles.taskHeader}>
                <span className={styles.taskIcon}>{getTaskIcon(task.schedulableClass)}</span>
                <div className={styles.taskInfo}>
                  <h4 className={styles.taskName}>{task.name}</h4>
                  <p className={styles.taskDescription}>{task.description}</p>
                </div>
                <Tag
                  className={styles.priorityTag}
                  type={
                    getTaskPriority(task.schedulableClass) === 'high'
                      ? 'red'
                      : getTaskPriority(task.schedulableClass) === 'medium'
                      ? 'cyan'
                      : 'gray'
                  }>
                  {getTaskPriority(task.schedulableClass).toUpperCase()}
                </Tag>
              </div>

              <div className={styles.taskActions}>
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={executingTaskId === task.uuid ? Renew : Play}
                  onClick={() => executeTask(task)}
                  disabled={executingTaskId !== null}>
                  {executingTaskId === task.uuid
                    ? t('executing', 'Executing...')
                    : executingTaskId !== null
                    ? t('pleaseWait', 'Please Wait')
                    : t('execute', 'Execute')}
                </Button>
              </div>

              {executingTaskId === task.uuid && (
                <div className={styles.executionStatus}>
                  <InlineLoading description={t('executingTask', 'Executing task...')} />
                </div>
              )}

              <div className={styles.taskMetadata}>
                <span className={styles.taskClass}>{task.schedulableClass}</span>
              </div>
            </Tile>
          ))
        )}
      </div>

      <div className={styles.upgradeInfo}>
        <Tile className={styles.infoTile}>
          <h4>{t('upgradeInformation', 'Upgrade Information')}</h4>
          <ul className={styles.infoList}>
            <li>
              <strong>{t('fullUpgrade', 'Full Upgrade')}:</strong>{' '}
              {t('fullUpgradeDesc', 'Use "Upgrade All EMR Components" for complete system updates')}
            </li>
            <li>
              <strong>{t('partialUpgrade', 'Partial Upgrade')}:</strong>{' '}
              {t(
                'partialUpgradeDesc',
                'Use individual tasks for specific component updates (forms, concepts, frontend)'
              )}
            </li>
            <li>
              <strong>{t('executionTime', 'Execution Time')}:</strong>{' '}
              {t('executionTimeDesc', 'Tasks may take several minutes to complete. Do not close the browser.')}
            </li>
          </ul>
        </Tile>
      </div>
    </div>
  );
};

export default UpgradeTasksContent;
