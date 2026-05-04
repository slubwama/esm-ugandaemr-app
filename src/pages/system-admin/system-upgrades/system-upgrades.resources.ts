import { openmrsFetch } from '@openmrs/esm-framework';
import { useCallback } from 'react';
import { type UpgradeTask, type UpgradeTaskResponse } from './system-upgrades.types';

const UPGRADE_TASK_CLASSES = [
  'org.openmrs.module.ugandaemr.tasks.DownloadFormsAndConceptsTask',
  'org.openmrs.module.ugandaemr.tasks.initializeFormsAndMetaDataTask',
  'org.openmrs.module.ugandaemr.tasks.UpdateFrontendTask',
  'org.openmrs.module.ugandaemr.tasks.UpgradeEnireEMRTask',
];

export function useUpgradeTasks() {
  const fetchUpgradeTasks = useCallback(async (): Promise<Array<UpgradeTask>> => {
    try {
      const response = await openmrsFetch('/ws/rest/v1/taskdefinition?v=custom:(uuid,name,description,taskClass)');
      const allTasks = response.data.results || [];

      // Filter only upgrade-related tasks
      const upgradeTasks = allTasks.filter((task: any) =>
        UPGRADE_TASK_CLASSES.includes(task.taskClass)
      );

      return upgradeTasks.map((task: any) => ({
        uuid: task.uuid,
        name: task.name,
        description: task.description,
        schedulableClass: task.taskClass,
        started: false,
      }));
    } catch (error) {
      console.error('Error fetching upgrade tasks:', error);
      throw error;
    }
  }, []);

  const executeUpgradeTask = useCallback(async (taskName: string): Promise<void> => {
    try {
      const response = await openmrsFetch('/ws/rest/v1/taskaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          action: 'runtask',
          tasks: [taskName],
        },
      });

      if (response.status !== 201) {
        throw new Error(`Task execution failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error executing upgrade task:', error);
      throw error;
    }
  }, []);

  return {
    fetchUpgradeTasks,
    executeUpgradeTask,
  };
}
