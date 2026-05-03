import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { SyncTaskLog } from './sync-logs.types';

export function useSyncLogs() {
  const apiUrl = '/ws/rest/v1/synctask?v=full';
  const { data, error, isLoading } = useSWR<{ data: { results: SyncTaskLog[] } }, Error>(
    apiUrl,
    openmrsFetch
  );

  return {
    logs: data ? data?.data?.results : [],
    isLoading,
    isError: error,
  };
}

export function useSyncLog(uuid: string) {
  const apiUrl = `/ws/rest/v1/synctask/${uuid}?v=full`;
  const { data, error, isLoading } = useSWR(uuid ? apiUrl : null, openmrsFetch);
  return {
    log: data,
    isLoading,
    isError: error,
  };
}
