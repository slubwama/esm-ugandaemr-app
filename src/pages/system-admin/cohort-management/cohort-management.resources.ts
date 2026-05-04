import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import {
  type CohortType,
  type Cohort,
  type CohortWithMembers,
  type CohortFormData,
} from './cohort-management.types';

export function useCohortTypes() {
  const apiUrl = '/ws/rest/v1/cohortm/cohorttype?v=default';
  const { data, error, isLoading } = useSWR<{ results: Array<CohortType> }, Error>(
    apiUrl,
    () => openmrsFetch(apiUrl).then((res) => res.json())
  );

  return {
    cohortTypes: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export function useCohorts(cohortTypeUuid?: string) {
  const apiUrl = cohortTypeUuid
    ? `/ws/rest/v1/cohortm/cohort?v=custom:(name,uuid,description,voided,cohortType,startDate)&cohortType=${cohortTypeUuid}`
    : null;

  const { data, error, isLoading } = useSWR<{ results: Array<Cohort> }, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then((res) => res.json()) : null
  );

  return {
    cohorts: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export function useCohortsWithMembers(cohortTypeUuid?: string) {
  const apiUrl = cohortTypeUuid
    ? `/ws/rest/v1/cohortm/cohort?v=custom:(name,cohortMembers,voided)&cohortType=${cohortTypeUuid}`
    : null;

  const { data, error, isLoading } = useSWR<{ results: Array<CohortWithMembers> }, Error>(
    apiUrl,
    apiUrl ? () => openmrsFetch(apiUrl).then((res) => res.json()) : null
  );

  return {
    cohortsWithMembers: data?.results ?? [],
    isLoading,
    isError: error,
  };
}

export async function createCohort(cohortData: CohortFormData) {
  const today = new Date();
  const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  const dataToPost = {
    name: cohortData.name,
    description: cohortData.description,
    uuid: cohortData.uuid,
    cohortType: cohortData.cohortType,
    location: '841cb8d9-b662-41ad-9e7f-d476caac48aa',
    groupCohort: false,
    startDate: date,
  };

  const response = await openmrsFetch('/ws/rest/v1/cohortm/cohort?v=full', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToPost),
  });

  return response.data;
}

export async function updateCohort(uuid: string, cohortData: CohortFormData) {
  const dataToPost = {
    name: cohortData.name,
    description: cohortData.description,
    uuid: cohortData.uuid,
    cohortType: cohortData.cohortType,
  };

  const response = await openmrsFetch(`/ws/rest/v1/ugandaemr/cohort/saveEdit?uuid=${uuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToPost),
  });

  return response.data;
}

export async function deleteCohort(uuid: string) {
  const response = await openmrsFetch(`/ws/rest/v1/ugandaemr/cohort/delete?uuid=${uuid}`, {
    method: 'GET',
  });

  return response.data;
}

export async function getCohortForEdit(uuid: string) {
  const response = await openmrsFetch(`/ws/rest/v1/ugandaemr/cohort/edit?uuid=${uuid}`);
  return response.data;
}

export async function removePatientFromCohort(memberUuid: string) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth() + 1;
  const dd = today.getDate();

  const ddStr = dd < 10 ? '0' + dd : dd.toString();
  const mmStr = mm < 10 ? '0' + mm : mm.toString();

  const formattedToday = yyyy + '-' + mmStr + '-' + ddStr;

  const dataToPost = {
    voided: true,
    endDate: formattedToday,
  };

  const response = await openmrsFetch(`/ws/rest/v1/cohortm/cohortmember/${memberUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToPost),
  });

  return response.data;
}

export async function getPatientData(patientUri: string) {
  const response = await openmrsFetch(`${patientUri}?v=custom:(person)`);
  return response.data.person;
}
