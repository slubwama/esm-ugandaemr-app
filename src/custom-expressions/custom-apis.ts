import { restBaseUrl, openmrsFetch } from '@openmrs/esm-framework';

export async function getCohortCategorization(uuid: string) {
  const apiUrl = `${restBaseUrl}/ugandaemr/crddpPharmacies?cohortTypeUuid=${uuid}`;

  return await openmrsFetch(apiUrl);
}
