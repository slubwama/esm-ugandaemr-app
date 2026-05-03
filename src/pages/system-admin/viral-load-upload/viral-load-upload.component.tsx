import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tile,
  InlineLoading,
  InlineNotification,
} from '@carbon/react';
import {
  Upload,
  Document,
  Checkmark,
  Error,
  Warning,
  Information,
  Close,
  Renew,
  Download,
} from '@carbon/react/icons';
import { useLayoutType , showNotification, showSnackbar } from '@openmrs/esm-framework';
import {
  uploadViralLoadCSV,
  getViralLoadTemplate,
  validateViralLoadCSV,
} from './viral-load-upload.resources';
import {
  type ViralLoadUploadResponse,
} from './viral-load-upload.types';
import styles from './viral-load-upload.scss';

const ViralLoadUploadContent: React.FC = () => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResponse, setUploadResponse] = useState<ViralLoadUploadResponse | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setUploadError('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadResponse(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Use real REST API
      const response = await uploadViralLoadCSV(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadResponse(response);

      showSnackbar({
        isLowContrast: true,
        kind: response.success ? 'success' : 'warning',
        title: response.success ? t('uploadComplete', 'Upload Complete') : t('uploadPartial', 'Upload Partial'),
        subtitle: `${response.message}. Processed: ${response.processedCount}, Successful: ${response.successCount}`,
        autoClose: true,
      });
    } catch (error) {
      let errorMessage = 'Upload failed';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setUploadError(errorMessage);
      showNotification({
        title: t('uploadFailed', 'Upload Failed'),
        kind: 'error',
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, t]);

  const handleReset = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedFile(null);
    setUploadResponse(null);
    setUploadError(null);
    setUploadProgress(0);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.viralLoadUploadContent}>
      <div className={styles.uploadContainer}>
        {/* Header */}
        <div className={styles.uploadHeader}>
          <h1>{t('viralLoadUpload', 'Viral Load Results Upload')}</h1>
          <p className={styles.uploadDescription}>
            {uploadResponse?.healthCenterName
              ? t('viralLoadUploadDescWithFacility', 'Upload viral load test results from CPHL dashboard for {{facilityName}}', {
                  facilityName: uploadResponse.healthCenterName,
                })
              : t('viralLoadUploadDesc', 'Upload viral load test results from CPHL dashboard')}
          </p>
        </div>

        {/* Error Notification */}
        {uploadError && (
          <InlineNotification
            kind="error"
            title={t('uploadError', 'Upload Error')}
            subtitle={uploadError}
            onClose={() => setUploadError(null)}
          />
        )}

        {/* Upload Section */}
        <div className={styles.uploadSection}>
          {/* Upload Area */}
          <div
            className={`${styles.uploadArea} ${isDragActive ? styles.dragActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!selectedFile ? handleBrowseClick : undefined}
          >
            {selectedFile ? (
              <div className={styles.selectedFile}>
                <div className={styles.fileInfo}>
                  <Document size={20} className={styles.fileIcon} />
                  <div className={styles.fileDetails}>
                    <div className={styles.fileName}>{selectedFile.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
                <Button
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  renderIcon={Close}
                  iconDescription={t('removeFile', 'Remove file')}
                  onClick={handleReset}
                  disabled={isUploading}
                />
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className={styles.fileInput}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                <div className={styles.uploadIcon}>
                  <Upload size={32} />
                </div>
                <h2 className={styles.uploadTitle}>
                  {t('uploadCSVFile', 'Upload CSV File')}
                </h2>
                <p className={styles.uploadDescription}>
                  {t('dragDropCSV', 'Drag and drop your CSV file here, or click to browse')}
                </p>
                <p className={styles.uploadHint}>
                  {t('csvFilesOnly', 'Only CSV files are accepted')}
                </p>
                <Button kind="primary" onClick={handleBrowseClick} disabled={isUploading}>
                  {t('chooseFile', 'Choose File')}
                </Button>
              </>
            )}
          </div>

          {/* Instructions Panel */}
          <div className={styles.instructionsPanel}>
            <div className={styles.instructionsHeader}>
              <Information size={20} />
              {t('howToUse', 'How to Use')}
            </div>
            <div className={styles.instructionsContent}>
              <div className={styles.instructionStep}>
                <div className={styles.stepTitle}>
                  <span className={styles.stepNumber}>1</span>
                  {t('downloadResults', 'Download Results')}
                </div>
                <div className={styles.stepDescription}>
                  {t('downloadResultsDesc', 'Visit ')}
                  <a
                    href="https://vldash.cphluganda.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cphlLink}
                  >
                    CPHL Viral Load Dashboard
                  </a>
                  {t('downloadResultsDesc2', ' and login with your health center credentials')}
                </div>
              </div>

              <div className={styles.instructionStep}>
                <div className={styles.stepTitle}>
                  <span className={styles.stepNumber}>2</span>
                  {t('navigateResults', 'Navigate to Results')}
                </div>
                <div className={styles.stepDescription}>
                  {t('navigateResultsDesc', 'On the navigation bar, select "Results" and click on your health center name')}
                </div>
              </div>

              <div className={styles.instructionStep}>
                <div className={styles.stepTitle}>
                  <span className={styles.stepNumber}>3</span>
                  {t('downloadForUpload', 'Download for EMR')}
                </div>
                <div className={styles.stepDescription}>
                  {t('downloadForUploadDesc', 'Click "Download For Upload in EMR" button to get the CSV file')}
                </div>
              </div>

              <div className={styles.instructionStep}>
                <div className={styles.stepTitle}>
                  <span className={styles.stepNumber}>4</span>
                  {t('uploadHere', 'Upload File')}
                </div>
                <div className={styles.stepDescription}>
                  {t('uploadHereDesc', 'Upload the downloaded CSV file using the upload area')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {isUploading && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <h2>{t('uploading', 'Uploading...')}</h2>
              <Renew size={20} className={styles.spinner} />
            </div>
            <div className={`${styles.progressBar} ${styles.processing}`}>
              <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className={styles.progressInfo}>
              <span>{t('processingFile', 'Processing file...')}</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        )}

        {/* Upload Complete Actions */}
        {selectedFile && !isUploading && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button kind="tertiary" onClick={handleReset} disabled={isUploading}>
              {t('reset', 'Reset')}
            </Button>
            <Button kind="primary" onClick={handleUpload} disabled={isUploading} renderIcon={Upload}>
              {isUploading ? t('uploading', 'Uploading...') : t('uploadFile', 'Upload File')}
            </Button>
          </div>
        )}

        {/* Results Section */}
        {uploadResponse && uploadResponse.success && (
          <>
            {/* Statistics */}
            <div className={styles.statisticsGrid}>
              <StatCard
                icon={Checkmark}
                type="success"
                value={uploadResponse.successCount}
                label={t('successfulUploads', 'Successful Uploads')}
              />
              <StatCard
                icon={Error}
                type="error"
                value={uploadResponse.noPatientFound?.length || 0}
                label={t('patientsNotFound', 'Patients Not Found')}
              />
              <StatCard
                icon={Warning}
                type="warning"
                value={uploadResponse.noEncounterFound?.length || 0}
                label={t('encountersNotFound', 'Encounters Not Found')}
              />
              <StatCard
                icon={Information}
                type="info"
                value={uploadResponse.patientResultNotReleased?.length || 0}
                label={t('resultsNotReleased', 'Results Not Released')}
              />
            </div>

            {/* Error Details */}
            {(uploadResponse.noPatientFound?.length > 0 ||
              uploadResponse.noEncounterFound?.length > 0 ||
              uploadResponse.patientResultNotReleased?.length > 0) && (
              <div className={styles.errorSummary}>
                {uploadResponse.noPatientFound &&
                  uploadResponse.noPatientFound.length > 0 && (
                  <ErrorSection
                    type="patients"
                    title={t('patientsNotFound', 'Patients Not Found')}
                    description={t('patientsNotFoundDesc', 'The following patients were not found in the system')}
                    items={uploadResponse.noPatientFound}
                  />
                )}

                {uploadResponse.noEncounterFound &&
                  uploadResponse.noEncounterFound.length > 0 && (
                  <ErrorSection
                    type="encounters"
                    title={t('encountersNotFound', 'Encounters Not Found')}
                    description={t('encountersNotFoundDesc', 'The following patients had no encounters on the collection date')}
                    items={uploadResponse.noEncounterFound}
                  />
                )}

                {uploadResponse.patientResultNotReleased &&
                  uploadResponse.patientResultNotReleased.length > 0 && (
                  <ErrorSection
                    type="results"
                    title={t('resultsNotReleased', 'Results Not Released')}
                    description={t('resultsNotReleasedDesc', 'The following patients have results that are not yet released')}
                    items={uploadResponse.patientResultNotReleased}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper Components
interface StatCardProps {
  icon: React.ComponentType<any>;
  type: 'success' | 'error' | 'warning' | 'info';
  value: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, type, value, label }) => (
  <div className={styles.statCard}>
    <div className={`${styles.statIcon} ${styles[type]}`}>
      <Icon size={24} />
    </div>
    <div className={styles.statValue}>{value}</div>
    <div className={styles.statLabel}>{label}</div>
  </div>
);

interface ErrorSectionProps {
  type: 'patients' | 'encounters' | 'results';
  title: string;
  description: string;
  items: string[];
}

const ErrorSection: React.FC<ErrorSectionProps> = ({ type, title, description, items }) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'patients':
        return <Error size={20} />;
      case 'encounters':
        return <Warning size={20} />;
      case 'results':
        return <Information size={20} />;
    }
  };

  return (
    <div className={`${styles.errorSection} ${styles[type]}`}>
      <div className={styles.errorTitle}>
        {getIcon()}
        {title}
      </div>
      <div className={styles.errorDescription}>{description}</div>
      <div className={styles.errorList}>
        {items.map((item, index) => (
          <div key={index} className={styles.errorItem}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViralLoadUploadContent;
