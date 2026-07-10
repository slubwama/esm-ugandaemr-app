import { type OpenmrsResource } from '@openmrs/esm-framework';
import { type DataSource } from '@openmrs/esm-form-engine-lib';
import { getCohortCategorization } from './custom-apis';

export class DSDMCategorizationDatasource implements DataSource<OpenmrsResource> {
  async fetchSingleItem(uuid: string): Promise<OpenmrsResource> {
    const response = await getCohortCategorization(uuid);

    const item = response?.data?.find((cohort) => cohort.uuid === uuid);

    if (!item) {
      throw new Error(`Cohort with uuid ${uuid} not found`);
    }

    return this.toUuidAndDisplay({
      uuid: item.uuid,
      display: item.name,
    });
  }

  async fetchData(searchTerm: string, config?: Record<string, any>): Promise<OpenmrsResource[]> {
    const cohortTypeUuid = config?.cohortUuid;

    if (!cohortTypeUuid) {
      return [];
    }

    const response = await getCohortCategorization(cohortTypeUuid);

    const cohorts = Array.isArray(response?.data) ? response.data : [];

    return cohorts
      .filter((item) =>
        searchTerm
          ? item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          : true,
      )
      .map((item) =>
        this.toUuidAndDisplay({
          uuid: item.uuid,
          display: item.name,
        }),
      );
  }

  toUuidAndDisplay(data: OpenmrsResource): OpenmrsResource {
    if (!data?.uuid || !data?.display) {
      throw new Error("'uuid' or 'display' not found in the OpenMRS object.");
    }

    return data;
  }
}
