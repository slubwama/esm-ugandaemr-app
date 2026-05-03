import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  TextInput,
  TextArea,
  Toggle,
  NumberInput,
  Select,
  SelectItem,
  FormGroup,
} from '@carbon/react';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import { updateSyncTaskType, createSyncTaskType } from './sync-task-types.resources';
import { SyncTaskType, SyncTaskTypeFormData } from './sync-task-types.types';
import styles from './tasktype-detail-modal.scss';

interface TaskTypeDetailModalProps {
  open: boolean;
  onClose: () => void;
  taskType?: SyncTaskType;
  onSave: () => void;
}

const taskTypeCategories = [
  { value: 'data_sync', label: 'Data Sync' },
  { value: 'data_validation', label: 'Data Validation' },
  { value: 'data_transform', label: 'Data Transform' },
  { value: 'cleanup', label: 'Cleanup' },
  { value: 'notification', label: 'Notification' },
  { value: 'custom', label: 'Custom' },
];

const executionFrequencies = [
  { value: 'on_demand', label: 'On Demand' },
  { value: '5m', label: 'Every 5 minutes' },
  { value: '15m', label: 'Every 15 minutes' },
  { value: '30m', label: 'Every 30 minutes' },
  { value: '1h', label: 'Every hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '12h', label: 'Every 12 hours' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
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
    description: '',
    taskEnabled: true,
    taskType: 'custom',
    executionOrder: 0,
    retryCount: 3,
    retryInterval: 60,
    executionFrequency: 'on_demand',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (taskType) {
      setFormData({
        name: taskType.name || '',
        description: taskType.description || '',
        taskEnabled: taskType.taskEnabled,
        taskType: taskType.taskType || 'custom',
        executionOrder: taskType.executionOrder || 0,
        retryCount: taskType.retryCount || 3,
        retryInterval: taskType.retryInterval || 60,
        executionFrequency: taskType.executionFrequency || 'on_demand',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        taskEnabled: true,
        taskType: 'custom',
        executionOrder: 0,
        retryCount: 3,
        retryInterval: 60,
        executionFrequency: 'on_demand',
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

  const isFormValid = formData.name && formData.taskType;

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
        <FormGroup legendText={t('taskTypeDetails', 'Task Type Details')}>
          <TextInput
            id="task-name"
            labelText={t('taskName', 'Task Name')}
            placeholder={t('enterTaskName', 'Enter task name')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className={styles.formField}
          />

          <TextArea
            id="task-description"
            labelText={t('description', 'Description')}
            placeholder={t('enterDescription', 'Enter description')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={styles.formField}
          />

          <Select
            id="task-type"
            labelText={t('taskType', 'Task Type')}
            value={formData.taskType}
            onChange={(e) => handleChange('taskType', e.target.value)}
            className={styles.formField}
          >
            {taskTypeCategories.map(category => (
              <SelectItem key={category.value} value={category.value} text={category.label}>
                {category.label}
              </SelectItem>
            ))}
          </Select>

          <Toggle
            id="task-enabled"
            labelText={t('taskEnabled', 'Task Enabled')}
            toggled={formData.taskEnabled}
            onToggle={(checked) => handleChange('taskEnabled', checked)}
            className={styles.formField}
          />
        </FormGroup>

        <FormGroup legendText={t('executionSettings', 'Execution Settings')}>
          <NumberInput
            id="execution-order"
            label={t('executionOrder', 'Execution Order')}
            value={formData.executionOrder}
            onChange={(e) => handleChange('executionOrder', parseInt((e.target as HTMLInputElement).value) || 0)}
            min={0}
            className={styles.formField}
          />

          <Select
            id="execution-frequency"
            labelText={t('executionFrequency', 'Execution Frequency')}
            value={formData.executionFrequency}
            onChange={(e) => handleChange('executionFrequency', e.target.value)}
            className={styles.formField}
          >
            {executionFrequencies.map(freq => (
              <SelectItem key={freq.value} value={freq.value} text={freq.label}>
                {freq.label}
              </SelectItem>
            ))}
          </Select>
        </FormGroup>

        <FormGroup legendText={t('retrySettings', 'Retry Settings')}>
          <NumberInput
            id="retry-count"
            label={t('retryCount', 'Retry Count')}
            value={formData.retryCount}
            onChange={(e) => handleChange('retryCount', parseInt((e.target as HTMLInputElement).value) || 0)}
            min={0}
            max={10}
            className={styles.formField}
          />

          <NumberInput
            id="retry-interval"
            label={t('retryIntervalSeconds', 'Retry Interval (seconds)')}
            value={formData.retryInterval}
            onChange={(e) => handleChange('retryInterval', parseInt((e.target as HTMLInputElement).value) || 0)}
            min={0}
            className={styles.formField}
          />
        </FormGroup>
      </div>
    </Modal>
  );
};

export default TaskTypeDetailModal;
