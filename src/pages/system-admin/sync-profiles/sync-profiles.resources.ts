import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { SyncFhirProfile, SyncProfileFormData, SyncProfileResponse } from './sync-profiles.types';

export function useSyncProfiles() {
  const apiUrl = '/ws/rest/v1/syncfhirprofile?v=full';
  const { data, error, isLoading, mutate } = useSWR<SyncProfileResponse, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then(res => res.json())
  );

  return {
    profiles: data?.results || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useSyncProfile(uuid: string) {
  const apiUrl = uuid ? `/ws/rest/v1/syncfhirprofile/${uuid}?v=full` : null;
  const { data, error, isLoading } = useSWR<SyncFhirProfile, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    profile: data,
    isLoading,
    isError: error,
  };
}

export async function updateSyncProfile(uuid: string, profileData: Partial<SyncProfileFormData>) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/syncfhirprofile/${uuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update sync profile: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error updating sync profile: ${error.message}`);
  }
}

export async function createSyncProfile(profileData: SyncProfileFormData) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch('/ws/rest/v1/syncfhirprofile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create sync profile: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error creating sync profile: ${error.message}`);
  }
}

export async function deleteSyncProfile(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/syncfhirprofile/${uuid}`, {
      method: 'DELETE',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete sync profile: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error deleting sync profile: ${error.message}`);
  }
}

export async function toggleProfileStatus(uuid: string, enabled: boolean) {
  return updateSyncProfile(uuid, { profileEnabled: enabled });
}

export async function exportProfiles() {
  const abortController = new AbortController();

  try {
    const response = await fetch('/rest/v1/ugandaemrsync/export/profiles/all', {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to export profiles: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    throw new Error(`Error exporting profiles: ${error.message}`);
  }
}

export async function testSyncConnection(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/syncfhirprofile/${uuid}/test`, {
      method: 'POST',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to test connection: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error testing connection: ${error.message}`);
  }
}

export async function triggerSync(uuid: string) {
  const abortController = new AbortController();

  try {
    const response = await openmrsFetch(`/ws/rest/v1/syncfhirprofile/${uuid}/sync`, {
      method: 'POST',
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger sync: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Error triggering sync: ${error.message}`);
  }
}
