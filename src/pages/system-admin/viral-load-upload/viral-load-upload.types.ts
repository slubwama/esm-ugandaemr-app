export interface ViralLoadUploadResponse {
  success: boolean;
  message: string;
  healthCenterName: string;
  processedCount: number;
  successCount: number;
  noEncounterFound: string[];
  noPatientFound: string[];
  patientResultNotReleased: string[];
}

export interface ViralLoadTemplate {
  description: string;
  requiredColumns: string[];
  exampleRow: string[];
  notes: string[];
}

export interface ViralLoadValidationResponse {
  validation: {
    valid: boolean;
    errors: string[];
    message: string;
  };
}

export interface ViralLoadUploadRequest {
  file: File;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ViralLoadResult {
  patientArtNo: string;
  dateCollected: string;
  vlQuantitative: string;
  vlQualitative: string;
  status: 'success' | 'patient_not_found' | 'encounter_not_found' | 'result_not_released';
  error?: string;
}

export interface UploadStatistics {
  totalRecords: number;
  successfulUploads: number;
  patientsNotFound: number;
  encountersNotFound: number;
  resultsNotReleased: number;
}
