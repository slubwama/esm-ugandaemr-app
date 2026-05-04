import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { type ScheduledTask, type ScheduledTaskResponse, type ScheduledTaskFormData, type SyncTask, type SyncTaskResponse } from './schedule-tasks.types';

export function useScheduledTasks() {
  const apiUrl = '/ws/rest/v1/taskdefinition?v=full';
  const { data, error, isLoading, mutate } = useSWR<ScheduledTaskResponse, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then(res => res.json())
  );

  return {
    tasks: data?.results || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useScheduledTask(uuid: string) {
  const apiUrl = uuid ? `/ws/rest/v1/taskdefinition/${uuid}?v=full` : null;
  const { data, error, isLoading } = useSWR<ScheduledTask, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    task: data,
    isLoading,
    isError: error,
  };
}

export async function updateScheduledTask(uuid: string, taskData: Partial<ScheduledTaskFormData>) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/taskdefinition/${uuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update scheduled task: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error updating scheduled task: ${error.message}`);
  }
}

export async function createScheduledTask(taskData: ScheduledTaskFormData) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch('/ws/rest/v1/taskdefinition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create scheduled task: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error creating scheduled task: ${error.message}`);
  }
}

export async function deleteScheduledTask(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/taskdefinition/${uuid}`, {
      method: 'DELETE',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete scheduled task: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error deleting scheduled task: ${error.message}`);
  }
}

export async function toggleTaskStatus(uuid: string, enabled: boolean) {
  return updateScheduledTask(uuid, { enabled });
}

export async function runTaskNow(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/taskdefinition/${uuid}/run`, {
      method: 'POST',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to run task: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error running task: ${error.message}`);
  }
}

// Sync Task Hooks
export function useSyncTasks() {
  const apiUrl = '/ws/rest/v1/synctask?v=full';
  const { data, error, isLoading, mutate } = useSWR<SyncTaskResponse, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then(res => res.json())
  );

  return {
    syncTasks: data?.results || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSyncTask(uuid: string) {
  const apiUrl = uuid ? `/ws/rest/v1/synctask/${uuid}?v=full` : null;
  const { data, error, isLoading } = useSWR<SyncTask, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    syncTask: data,
    isLoading,
    isError: error,
  };
}
