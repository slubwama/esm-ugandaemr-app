import { openmrsFetch } from '@openmrs/esm-framework';
import {
  CohortType,
  Cohort,
  CohortWithMembers,
  CohortFormData,
} from './cohort-management.types';

export function useCohortTypes() {
  const abortController = new AbortController();

  const fetchCohortTypes = async () => {
    const response = await openmrsFetch('/ws/rest/v1/cohortm/cohorttype?v=default', {
      signal: abortController.signal,
    });
    return response.data.results;
  };

  return { fetchCohortTypes, abortController };
}

export function useCohorts(cohortTypeUuid?: string) {
  const abortController = new AbortController();

  const fetchCohorts = async () => {
    const url = cohortTypeUuid
      ? `/ws/rest/v1/cohortm/cohort?v=custom:(name,uuid,description,voided,cohortType,startDate)&cohortType=${cohortTypeUuid}`
      : '/ws/rest/v1/cohortm/cohort?v=custom:(name,uuid,description,voided,cohortType,startDate)';

    const response = await openmrsFetch(url, {
      signal: abortController.signal,
    });
    return response.data.results;
  };

  return { fetchCohorts, abortController };
}

export function useCohortsWithMembers(cohortTypeUuid?: string) {
  const abortController = new AbortController();

  const fetchCohortsWithMembers = async () => {
    const url = cohortTypeUuid
      ? `/ws/rest/v1/cohortm/cohort?v=custom:(name,cohortMembers,voided)&cohortType=${cohortTypeUuid}`
      : '/ws/rest/v1/cohortm/cohort?v=custom:(name,cohortMembers,voided)';

    const response = await openmrsFetch(url, {
      signal: abortController.signal,
    });
    return response.data.results;
  };

  return { fetchCohortsWithMembers, abortController };
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
  let mm = today.getMonth() + 1;
  let dd = today.getDate();

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
