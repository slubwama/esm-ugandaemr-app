import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { type SyncFhirProfile, type SyncProfileFormData, type SyncProfileResponse } from './sync-profiles.types';

interface ApiError {
  message?: string;
  error?: string | { message?: string };
  fieldErrors?: Array<{ field?: string; message?: string }>;
  errors?: Array<{ message?: string; property?: string }>;
  responseBody?: any;
}

/**
 * Extract meaningful error message from various error formats
 */
function extractErrorMessage(error: any): string {
  // Check for responseBody first (from openmrsFetch errors)
  if (error?.responseBody) {
    const responseBody = error.responseBody;
    if (typeof responseBody === 'string') {
      try {
        const parsed = JSON.parse(responseBody);
        return extractErrorMessage(parsed);
      } catch {
        return responseBody;
      }
    }
    return extractErrorMessage(responseBody);
  }

  // Check for OpenMRS error format
  if (error?.error?.message) {
    return error.error.message;
  }

  // Check for field errors (validation errors)
  if (error?.fieldErrors?.length > 0) {
    const fieldErrors = error.fieldErrors
      .map((fe: any) => `${fe.field || 'Field'}: ${fe.message}`)
      .join(', ');
    return `Validation errors: ${fieldErrors}`;
  }

  // Check for errors array (another common format)
  if (error?.errors?.length > 0) {
    const errors = error.errors
      .map((e: any) => e.message || e.property || JSON.stringify(e))
      .filter(Boolean)
      .join(', ');
    return errors || 'Multiple errors occurred';
  }

  // Check for error object with message
  if (error?.message) {
    return error.message;
  }

  // Check for error string
  if (typeof error === 'string') {
    return error;
  }

  // Check for error property directly
  if (error?.error) {
    return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  }

  return 'An unknown error occurred';
}

export interface PatientIdentifierType {
  uuid: string;
  name: string;
  description?: string;
}

export interface PatientIdentifierTypesResponse {
  results: PatientIdentifierType[];
}

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

export function usePatientIdentifierTypes() {
  const apiUrl = '/ws/rest/v1/patientidentifiertype?v=custom:(uuid,name,description)';
  const { data, error, isLoading } = useSWR<PatientIdentifierTypesResponse | PatientIdentifierType[], Error>(
    apiUrl,
    async () => {
      const res = await openmrsFetch(apiUrl);
      const json = await res.json();
      return json;
    }
  );

  // Handle both response formats: { results: [] } or direct array []
  const results = Array.isArray(data) ? data : (data?.results || []);

  return {
    patientIdentifierTypes: results,
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
      // Extract error message from response
      const errorData = response.data as any;
      const errorMessage = extractErrorMessage(errorData);
      const errorObj = new Error(errorMessage);
      (errorObj as any).responseBody = errorData;
      throw errorObj;
    }

    return response.data;
  } catch (error: any) {
    // Handle AbortError separately (user cancelled)
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }

    // Extract meaningful error message
    const errorMessage = extractErrorMessage(error);

    // Create a more user-friendly error with context
    const enhancedError = new Error(`Failed to update sync profile: ${errorMessage}`);
    (enhancedError as any).originalError = error;
    (enhancedError as any).responseBody = error?.responseBody || error?.response?.data;

    throw enhancedError;
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
      // Extract error message from response
      const errorData = response.data as any;
      const errorMessage = extractErrorMessage(errorData);
      const errorObj = new Error(errorMessage);
      (errorObj as any).responseBody = errorData;
      throw errorObj;
    }

    return response.data;
  } catch (error: any) {
    // Handle AbortError separately (user cancelled)
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }

    // Extract meaningful error message
    const errorMessage = extractErrorMessage(error);

    // Create a more user-friendly error with context
    const enhancedError = new Error(`Failed to create sync profile: ${errorMessage}`);
    (enhancedError as any).originalError = error;
    (enhancedError as any).responseBody = error?.responseBody || error?.response?.data;

    throw enhancedError;
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
      const errorData = response.data as any;
      const errorMessage = extractErrorMessage(errorData);
      throw new Error(`Failed to delete sync profile: ${errorMessage}`);
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Error deleting sync profile: ${errorMessage}`);
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
      const errorData = response.data as any;
      const errorMessage = extractErrorMessage(errorData);
      throw new Error(`Failed to test connection: ${errorMessage}`);
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Error testing connection: ${errorMessage}`);
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
      const errorData = response.data as any;
      const errorMessage = extractErrorMessage(errorData);
      throw new Error(`Failed to trigger sync: ${errorMessage}`);
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Error triggering sync: ${errorMessage}`);
  }
}
