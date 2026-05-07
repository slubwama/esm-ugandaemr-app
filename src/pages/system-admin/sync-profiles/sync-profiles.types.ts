// All available resource types from GSP
export const ALL_RESOURCE_TYPES = [
  'Patient',
  'Person',
  'EpisodeOfCare',
  'Encounter',
  'Immunization',
  'MedicationDispense',
  'MedicationRequest',
  'Observation',
  'ServiceRequest',
  'Practitioner',
  'Condition',
  'AllergyIntolerance',
  'DiagnosticReport',
] as const;

export type ResourceType = typeof ALL_RESOURCE_TYPES[number];

// Case-based primary resource types from GSP
export const CASE_BASED_RESOURCE_TYPES = [
  { value: 'EpisodeOfCare', label: 'Episode of Care (Program)' },
  { value: 'Encounter', label: 'Encounter' },
  { value: 'ProgramWorkFlowState', label: 'Program Workflow State' },
  { value: 'PatientIdentifierType', label: 'Patient Identifier Type' },
  { value: 'Order', label: 'Order' },
  { value: 'CohortType', label: 'Cohort Type' },
] as const;

export type CaseBasedResourceType = typeof CASE_BASED_RESOURCE_TYPES[number]['value'];

// Date range parameter structure
interface DateRangeParam {
  lowerBound?: string;
  myUpperBound?: string;
}

// Concept reference used in code filters - contains both the identifier and display name
// BACKWARD COMPATIBILITY: The 'code' field can be:
// - Legacy: Array of UUID strings (e.g., ["uuid1", "uuid2"])
// - New: Array of ConceptReference objects with full concept data
export interface ConceptReference {
  uuid: string;
  display: string;
  id?: number;
  conceptClass?: string;
  datatype?: string;
}

// Legacy format: code as array of UUID strings
export type LegacyCodeArray = (string | number)[];

// Union type for code field - supports both legacy and new formats
export type CodeField = LegacyCodeArray | ConceptReference[];

// Helper type to check if code array is in new format
export function isConceptReferenceArray(code: any): code is ConceptReference[] {
  if (!Array.isArray(code) || code.length === 0) return false;
  const first = code[0];
  return first && typeof first === 'object' && 'uuid' in first && 'display' in first;
}

// Helper to extract UUIDs from either format
export function extractUuidsFromCode(code: CodeField | undefined): string[] {
  if (!code || code.length === 0) return [];

  if (isConceptReferenceArray(code)) {
    // New format: extract UUID from objects
    return code.map(c => c.uuid).filter(Boolean);
  } else {
    // Legacy format: already UUIDs (or numbers to convert)
    return code.map(c => String(c)).filter(Boolean);
  }
}

// Encounter type reference - similar to ConceptReference but for encounter types
export interface EncounterTypeReference {
  uuid: string;
  display: string;
  description?: string;
}

// Union type for encounter type field - supports both legacy and new formats
export type EncounterTypeField = string[] | EncounterTypeReference[];

// Helper to check if encounter type array is in the new format
export function isEncounterTypeReferenceArray(typeArray: any): typeArray is EncounterTypeReference[] {
  if (!Array.isArray(typeArray) || typeArray.length === 0) return false;
  const first = typeArray[0];
  return first && typeof first === 'object' && 'uuid' in first && 'display' in first;
}

// Helper to extract UUIDs from encounter type field
export function extractUuidsFromEncounterType(typeValue: EncounterTypeField | undefined): string[] {
  if (!typeValue || typeValue.length === 0) return [];

  if (isEncounterTypeReferenceArray(typeValue)) {
    // New format: extract UUID from objects
    return typeValue.map(t => t.uuid).filter(Boolean);
  } else {
    // Legacy format: already UUIDs
    return typeValue.filter(Boolean);
  }
}

// EpisodeOfCare (Program) reference
export interface ProgramReference {
  uuid: string;
  display: string;
  description?: string;
}

// Union type for program field - supports both legacy and new formats
export type ProgramField = string[] | ProgramReference[];

// Helper to check if program array is in the new format
export function isProgramReferenceArray(programArray: any): programArray is ProgramReference[] {
  if (!Array.isArray(programArray) || programArray.length === 0) return false;
  const first = programArray[0];
  return first && typeof first === 'object' && 'uuid' in first && 'display' in first;
}

// Helper to extract UUIDs from program field
export function extractUuidsFromProgram(programValue: ProgramField | undefined): string[] {
  if (!programValue || programValue.length === 0) return [];

  if (isProgramReferenceArray(programValue)) {
    // New format: extract UUID from objects
    return programValue.map(p => p.uuid).filter(Boolean);
  } else {
    // Legacy format: already UUIDs
    return programValue.filter(Boolean);
  }
}

// Common filter structure for clinical resources (Observation, MedicationRequest, etc.)
interface ClinicalResourceFilter {
  encounterReference?: string[];
  patientReference?: string[];
  hasMemberReference?: string[];
  valueConcept?: string;
  valueDateParam?: DateRangeParam;
  valueQuantityParam?: any[];
  valueStringParam?: string[];
  date?: DateRangeParam;
  code?: CodeField;
  category?: any[];
  id?: any[];
  lastUpdated?: DateRangeParam;
}

// Resource search parameters/filters structure - matches the actual API response
export interface ResourceSearchParameter {
  observationFilter?: ClinicalResourceFilter;
  patientFilter?: {
    name?: string[];
    given?: string[];
    family?: string[];
    identifier?: string[];
    gender?: string[];
    birthDate?: DateRangeParam;
    deathDate?: DateRangeParam;
    deceased?: any[];
    city?: string[];
    state?: string[];
    postalCode?: string[];
    country?: string[];
    id?: any[];
    lastUpdated?: DateRangeParam;
  };
  encounterFilter?: {
    date?: DateRangeParam;
    location?: string[];
    participant?: string[];
    subject?: string[];
    type?: EncounterTypeField;
    id?: any[];
    lastUpdated?: DateRangeParam;
  };
  personFilter?: {
    name?: string[];
    gender?: string[];
    birthDate?: DateRangeParam;
    deceased?: any[];
    city?: string[];
    state?: string[];
    postalCode?: string[];
    country?: string[];
    id?: any[];
    lastUpdated?: DateRangeParam;
  };
  practitionerFilter?: {
    identifier?: string[];
    name?: string[];
    given?: string[];
    family?: string[];
    deceased?: any[];
    city?: string[];
    state?: string[];
    postalCode?: string[];
    country?: string[];
    id?: any[];
    lastUpdated?: DateRangeParam;
  };
  episodeofcareFilter?: {
    type?: ProgramField;
    lastUpdated?: DateRangeParam;
  };
  medicationdispenseFilter?: ClinicalResourceFilter;
  medicationrequestFilter?: ClinicalResourceFilter;
  diagnosticreportFilter?: ClinicalResourceFilter;
  conditionFilter?: ClinicalResourceFilter;
  servicerequestFilter?: ClinicalResourceFilter;
}

export interface SyncFhirProfile {
  uuid: string;
  name: string;
  description?: string;
  profileEnabled: boolean;
  serverUrl: string;
  username?: string;
  password?: string;
  urlToken?: string;
  lastSyncDate?: string;
  syncStatus?: 'success' | 'failed' | 'pending' | 'in_progress';
  syncFrequency?: string;
  resourceTypes?: string[];
  // Additional fields from GSP
  generateBundle?: boolean;
  syncDataEverSince?: boolean;
  dataToSyncStartDate?: string;
  numberOfResourcesInBundle?: number;
  durationToKeepSyncedResources?: number;
  isCaseBasedProfile?: boolean;
  caseBasedPrimaryResourceType?: string;
  caseBasedPrimaryResourceTypeId?: string;
  patientIdentifierType?: string;
  resourceSearchParameter?: ResourceSearchParameter;
  syncLimit?: number;
  searchable?: boolean;
  searchURL?: string;
}

export interface SyncProfileFormData {
  name: string;
  description?: string;
  profileEnabled: boolean;
  serverUrl: string;
  username?: string;
  password?: string;
  urlToken?: string;
  syncFrequency?: string;
  resourceTypes?: string[];
  // Additional fields from GSP
  generateBundle?: boolean;
  syncDataEverSince?: boolean;
  dataToSyncStartDate?: string;
  numberOfResourcesInBundle?: number;
  durationToKeepSyncedResources?: number;
  isCaseBasedProfile?: boolean;
  caseBasedPrimaryResourceType?: string;
  caseBasedPrimaryResourceTypeId?: string;
  patientIdentifierType?: string;
  resourceSearchParameter?: ResourceSearchParameter;
  syncLimit?: number;
  searchable?: boolean;
  searchURL?: string;
}

export interface SyncProfileResponse {
  results: SyncFhirProfile[];
}

export interface SyncApiResponse {
  data?: any;
  error?: string;
  status?: number;
}

export type SyncProfileStatus = 'success' | 'failed' | 'pending' | 'in_progress';
