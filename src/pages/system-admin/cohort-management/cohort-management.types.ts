export interface CohortType {
  uuid: string;
  name: string;
  description?: string;
}

export interface Cohort {
  uuid: string;
  name: string;
  description: string;
  cohortType: CohortType;
  startDate: string;
  voided: boolean;
}

export interface CohortMember {
  uuid: string;
  patient: {
    uuid: string;
    display: string;
    links: Array<{
      rel: string;
      uri: string;
    }>;
  };
  voided: boolean;
  startDate: string;
  endDate?: string;
}

export interface CohortWithMembers {
  uuid: string;
  name: string;
  voided: boolean;
  cohortMembers: Array<CohortMember>;
}

export interface Patient {
  display: string;
  age: number;
  birthdate: string;
  gender: string;
}

export interface CohortFormData {
  name: string;
  description: string;
  uuid: string;
  cohortType: string;
}
