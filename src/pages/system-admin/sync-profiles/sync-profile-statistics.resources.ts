import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import {
  type SyncFhirProfile,
  type SyncFhirCase,
  type SyncFhirResource,
  type SyncFhirProfileLog,
} from './sync-profile-statistics.types';

export function useSyncFhirProfiles() {
  const apiUrl = '/ws/rest/v1/syncfhirprofile?v=full';
  const { data, error, isLoading } = useSWR<{ results: Array<SyncFhirProfile> }, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then(res => res.json())
  );

  return {
    profiles: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export function useSyncFhirCases(profileUuid: string) {
  const apiUrl = profileUuid
    ? `/ws/rest/v1/syncfhircase?profile=${profileUuid}&v=full`
    : null;
  const { data, error, isLoading } = useSWR<{ results: Array<SyncFhirCase> }, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    cases: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export function useSyncFhirResources(profileUuid: string) {
  const apiUrl = profileUuid
    ? `/ws/rest/v1/syncfhirresource?profile=${profileUuid}&v=full`
    : null;
  const { data, error, isLoading } = useSWR<{ results: Array<SyncFhirResource> }, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    resources: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export function useSyncFhirProfileLogs(profileUuid: string) {
  const apiUrl = profileUuid
    ? `/ws/rest/v1/syncfhirprofilelog?profile=${profileUuid}&v=full`
    : null;
  const { data, error, isLoading } = useSWR<{ results: Array<SyncFhirProfileLog> }, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then(res => res.json()) : null
  );

  return {
    logs: data?.results ?? [],
    isLoading,
    isError: error,
  };
}
