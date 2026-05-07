import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  TextInput,
  PasswordInput,
  Select,
  SelectItem,
  FormGroup,
} from '@carbon/react';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import { updateSyncTaskType, createSyncTaskType } from './sync-task-types.resources';
import { type SyncTaskType, type SyncTaskTypeFormData } from './sync-task-types.types';
import styles from './tasktype-detail-modal.scss';

interface TaskTypeDetailModalProps {
  open: boolean;
  onClose: () => void;
  taskType?: SyncTaskType;
  onSave: () => void;
}

const dataTypes = [
  { value: 'FHIR', label: 'FHIR' },
  { value: 'REST', label: 'REST' },
  { value: 'HL7', label: 'HL7' },
  { value: 'DATABASE', label: 'Database' },
];

const tokenTypes = [
  { value: 'Bearer', label: 'Bearer' },
  { value: 'Basic', label: 'Basic' },
  { value: 'API Key', label: 'API Key' },
  { value: 'OAuth', label: 'OAuth' },
];

const TaskTypeDetailModal: React.FC<TaskTypeDetailModalProps> = ({
  open,
  onClose,
  taskType,
  onSave,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SyncTaskTypeFormData>({
    name: '',
    dataType: '',
    url: '',
    urlUserName: '',
    urlPassword: '',
    urlToken: '',
    tokenType: 'Bearer',
    tokenExpiryDate: '',
    tokenRefreshKey: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (taskType) {
      setFormData({
        name: taskType.name || '',
        dataType: taskType.dataType || '',
        url: taskType.url || '',
        urlUserName: taskType.urlUserName || '',
        urlPassword: taskType.urlPassword || '',
        urlToken: taskType.urlToken || '',
        tokenType: taskType.tokenType || 'Bearer',
        tokenExpiryDate: taskType.tokenExpiryDate || '',
        tokenRefreshKey: taskType.tokenRefreshKey || '',
      });
    } else {
      setFormData({
        name: '',
        dataType: '',
        url: '',
        urlUserName: '',
        urlPassword: '',
        urlToken: '',
        tokenType: 'Bearer',
        tokenExpiryDate: '',
        tokenRefreshKey: '',
      });
    }
  }, [taskType, open]);

  const handleChange = (field: keyof SyncTaskTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      if (taskType?.uuid) {
        await updateSyncTaskType(taskType.uuid, formData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('taskTypeUpdated', 'Task Type updated'),
          subtitle: t('taskTypeUpdatedSuccess', 'Sync task type has been updated successfully'),
          autoClose: true,
        });
      } else {
        await createSyncTaskType(formData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('taskTypeCreated', 'Task Type created'),
          subtitle: t('taskTypeCreatedSuccess', 'Sync task type has been created successfully'),
          autoClose: true,
        });
      }
      onSave();
      onClose();
    } catch (error) {
      showNotification({
        title: t('errorSavingTaskType', 'Error saving task type'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.name && formData.dataType;

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading={taskType ? t('editTaskType', 'Edit Task Type') : t('createTaskType', 'Create Task Type')}
      modalLabel={t('syncTaskTypes', 'Sync Task Types')}
      primaryButtonText={t('save', 'Save')}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={!isFormValid || isSaving}
      size="lg"
    >
      <div className={styles.modalContent}>
        <FormGroup legendText={t('basicInfo', 'Basic Information')}>
          <TextInput
            id="task-name"
            labelText={t('name', 'Name')}
            placeholder={t('enterName', 'Enter name')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className={styles.formField}
          />

          <Select
            id="data-type"
            labelText={t('dataType', 'Data Type')}
            value={formData.dataType}
            onChange={(e) => handleChange('dataType', e.target.value)}
            className={styles.formField}
          >
            <SelectItem value="" text={t('selectDataType', 'Select data type')} />
            {dataTypes.map(type => (
              <SelectItem key={type.value} value={type.value} text={type.label}>
                {type.label}
              </SelectItem>
            ))}
          </Select>

          <TextInput
            id="url"
            labelText={t('url', 'URL')}
            placeholder={t('enterUrl', 'Enter URL')}
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            className={styles.formField}
          />
        </FormGroup>

        <FormGroup legendText={t('authentication', 'Authentication')}>
          <TextInput
            id="url-username"
            labelText={t('username', 'Username')}
            placeholder={t('enterUsername', 'Enter username')}
            value={formData.urlUserName}
            onChange={(e) => handleChange('urlUserName', e.target.value)}
            className={styles.formField}
          />

          <PasswordInput
            id="url-password"
            labelText={t('password', 'Password')}
            placeholder={t('enterPassword', 'Enter password')}
            value={formData.urlPassword}
            onChange={(e) => handleChange('urlPassword', e.target.value)}
            className={styles.formField}
          />

          <TextInput
            id="url-token"
            labelText={t('token', 'Token')}
            placeholder={t('enterToken', 'Enter token')}
            value={formData.urlToken}
            onChange={(e) => handleChange('urlToken', e.target.value)}
            className={styles.formField}
          />

          <Select
            id="token-type"
            labelText={t('tokenType', 'Token Type')}
            value={formData.tokenType}
            onChange={(e) => handleChange('tokenType', e.target.value)}
            className={styles.formField}
          >
            {tokenTypes.map(type => (
              <SelectItem key={type.value} value={type.value} text={type.label}>
                {type.label}
              </SelectItem>
            ))}
          </Select>

          <TextInput
            id="token-expiry-date"
            labelText={t('tokenExpiryDate', 'Token Expiry Date')}
            placeholder={t('enterTokenExpiryDate', 'Enter token expiry date')}
            value={formData.tokenExpiryDate}
            onChange={(e) => handleChange('tokenExpiryDate', e.target.value)}
            className={styles.formField}
          />

          <TextInput
            id="token-refresh-key"
            labelText={t('tokenRefreshKey', 'Token Refresh Key')}
            placeholder={t('enterTokenRefreshKey', 'Enter token refresh key')}
            value={formData.tokenRefreshKey}
            onChange={(e) => handleChange('tokenRefreshKey', e.target.value)}
            className={styles.formField}
          />
        </FormGroup>
      </div>
    </Modal>
  );
};

export default TaskTypeDetailModal;
