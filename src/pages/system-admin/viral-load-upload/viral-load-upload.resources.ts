import { openmrsFetch } from '@openmrs/esm-framework';
import {
  ViralLoadUploadResponse,
  ViralLoadTemplate,
  ViralLoadValidationResponse,
  ViralLoadResult,
  UploadStatistics,
} from './viral-load-upload.types';

const API_BASE_URL = '/ws/rest/v1/ugandaemrsync/viralload';

export async function uploadViralLoadCSV(file: File): Promise<ViralLoadUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await openmrsFetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading viral load CSV:', error);
    throw error;
  }
}

export async function getViralLoadTemplate(): Promise<ViralLoadTemplate> {
  try {
    const response = await openmrsFetch(`${API_BASE_URL}/template`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get template: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting viral load template:', error);
    throw error;
  }
}

export async function validateViralLoadCSV(file: File): Promise<ViralLoadValidationResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await openmrsFetch(`${API_BASE_URL}/validate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating viral load CSV:', error);
    throw error;
  }
}

export function simulateViralLoadUpload(file: File): Promise<ViralLoadUploadResponse> {
  return new Promise((resolve) => {
    // Simulate file reading and processing
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const results: ViralLoadResult[] = [];
      const patientsNotFound: string[] = [];
      const encountersNotFound: string[] = [];
      const resultsNotReleased: string[] = [];

      // Skip header row
      for (let i = 1; i < Math.min(lines.length, 10); i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 6) {
          // Simulate random results
          const random = Math.random();
          let result: ViralLoadResult;

          if (random < 0.7) {
            result = {
              patientArtNo: columns[5]?.replace(/"/g, '') || `PAT${i}`,
              dateCollected: columns[6]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
              vlQuantitative: columns[8]?.replace(/"/g, '') || 'Copy Number',
              vlQualitative: columns[9]?.replace(/"/g, '') || 'Detected',
              status: 'success',
            };
          } else if (random < 0.8) {
            result = {
              patientArtNo: columns[5]?.replace(/"/g, '') || `PAT${i}`,
              dateCollected: columns[6]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
              vlQuantitative: columns[8]?.replace(/"/g, '') || 'Copy Number',
              vlQualitative: columns[9]?.replace(/"/g, '') || 'Detected',
              status: 'patient_not_found',
            };
            patientsNotFound.push(result.patientArtNo);
          } else if (random < 0.9) {
            result = {
              patientArtNo: columns[5]?.replace(/"/g, '') || `PAT${i}`,
              dateCollected: columns[6]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
              vlQuantitative: columns[8]?.replace(/"/g, '') || 'Copy Number',
              vlQualitative: columns[9]?.replace(/"/g, '') || 'Detected',
              status: 'encounter_not_found',
            };
            encountersNotFound.push(result.patientArtNo);
          } else {
            result = {
              patientArtNo: columns[5]?.replace(/"/g, '') || `PAT${i}`,
              dateCollected: columns[6]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
              vlQuantitative: columns[8]?.replace(/"/g, '') || 'Copy Number',
              vlQualitative: columns[9]?.replace(/"/g, '') || 'Not Released',
              status: 'result_not_released',
            };
            resultsNotReleased.push(result.patientArtNo);
          }

          results.push(result);
        }
      }

      setTimeout(() => {
        const successCount = results.filter(r => r.status === 'success').length;
        resolve({
          success: true,
          message: 'Viral load results processed successfully',
          healthCenterName: 'Test Health Center',
          processedCount: results.length,
          successCount: successCount,
          noPatientFound: patientsNotFound,
          noEncounterFound: encountersNotFound,
          patientResultNotReleased: resultsNotReleased,
        });
      }, 2000);
    };

    reader.readAsText(file);
  });
}

export function calculateUploadStatistics(results: ViralLoadResult[]): UploadStatistics {
  return {
    totalRecords: results.length,
    successfulUploads: results.filter(r => r.status === 'success').length,
    patientsNotFound: results.filter(r => r.status === 'patient_not_found').length,
    encountersNotFound: results.filter(r => r.status === 'encounter_not_found').length,
    resultsNotReleased: results.filter(r => r.status === 'result_not_released').length,
  };
}
