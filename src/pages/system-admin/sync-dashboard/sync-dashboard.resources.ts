import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { type SyncDashboardMetrics, type SyncAlert, type SyncActivity, type ActiveSyncOperation, type DashboardData } from './sync-dashboard.types';

export function useDashboardMetrics() {
  const apiUrl = '/ws/rest/v1/ugandaemrsync/dashboard/metrics';
  const { data, error, isLoading } = useSWR<
    { data: SyncDashboardMetrics },
    Error
  >(apiUrl, openmrsFetch);

  return {
    metrics: data?.data,
    isLoading,
    isError: error,
  };
}

export function useSyncAlerts() {
  const apiUrl = '/ws/rest/v1/ugandaemrsync/dashboard/alerts';
  const { data, error, isLoading } = useSWR<
    { data: { results: SyncAlert[] } },
    Error
  >(apiUrl, openmrsFetch);

  return {
    alerts: data?.data?.results || [],
    isLoading,
    isError: error,
  };
}

export function useRecentActivities() {
  const apiUrl = '/ws/rest/v1/ugandaemrsync/dashboard/activities';
  const { data, error, isLoading } = useSWR<
    { data: { results: SyncActivity[] } },
    Error
  >(apiUrl, openmrsFetch);

  return {
    activities: data?.data?.results || [],
    isLoading,
    isError: error,
  };
}

export function useActiveOperations() {
  const apiUrl = '/ws/rest/v1/ugandaemrsync/dashboard/active';
  const { data, error, isLoading } = useSWR<
    { data: { results: ActiveSyncOperation[] } },
    Error
  >(
    apiUrl,
    openmrsFetch,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );

  return {
    operations: data?.data?.results || [],
    isLoading,
    isError: error,
  };
}

export function useDashboardData() {
  const apiUrl = '/ws/rest/v1/ugandaemrsync/dashboard';
  const { data, error, isLoading, mutate } = useSWR<
    { data: DashboardData },
    Error
  >(
    apiUrl,
    openmrsFetch,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  );

  return {
    dashboardData: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function dismissAlert(alertId: string) {
  const response = await openmrsFetch(`/ws/rest/v1/ugandaemrsync/dashboard/alerts/${alertId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolved: true }),
  });

  if (!response.ok) {
    throw new Error(`Failed to dismiss alert: ${response.statusText}`);
  }

  return response.json();
}

export async function triggerProfileSync(profileUuid: string) {
  const response = await openmrsFetch(`/ws/rest/v1/syncfhirprofile/${profileUuid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'trigger_sync' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger sync: ${response.statusText}`);
  }

  return response.json();
}
