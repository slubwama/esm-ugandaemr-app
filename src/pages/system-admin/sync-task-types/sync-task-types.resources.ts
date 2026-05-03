import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { type SyncTaskType, type SyncTaskTypeFormData, type SyncTaskTypeResponse } from './sync-task-types.types';

export function useSyncTaskTypes() {
  const apiUrl = '/ws/rest/v1/synctasktype?v=full';
  const { data, error, isLoading, mutate } = useSWR<SyncTaskTypeResponse, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then(res => res.json())
  );

  return {
    taskTypes: data?.results || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSyncTaskType(uuid: string) {
  const apiUrl = uuid ? `/ws/rest/v1/synctasktype/${uuid}?v=full` : null;
  const { data, error, isLoading } = useSWR<SyncTaskType, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    taskType: data,
    isLoading,
    isError: error,
  };
}

export async function updateSyncTaskType(uuid: string, taskTypeData: Partial<SyncTaskTypeFormData>) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/synctasktype/${uuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(taskTypeData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update sync task type: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error updating sync task type: ${error.message}`);
  }
}

export async function createSyncTaskType(taskTypeData: SyncTaskTypeFormData) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch('/ws/rest/v1/synctasktype', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(taskTypeData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create sync task type: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error creating sync task type: ${error.message}`);
  }
}

export async function deleteSyncTaskType(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/synctasktype/${uuid}`, {
      method: 'DELETE',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete sync task type: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error deleting sync task type: ${error.message}`);
  }
}

export async function toggleTaskTypeStatus(uuid: string, enabled: boolean) {
  return updateSyncTaskType(uuid, { taskEnabled: enabled });
}

export async function exportTaskTypes() {
  const abortController = new AbortController();

  try {
    const response = await fetch('/rest/v1/ugandaemrsync/export/tasktypes/all', {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to export task types: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    throw new Error(`Error exporting task types: ${error.message}`);
  }
}

export async function executeTaskType(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/synctasktype/${uuid}/execute`, {
      method: 'POST',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to execute task: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error executing task: ${error.message}`);
  }
}
