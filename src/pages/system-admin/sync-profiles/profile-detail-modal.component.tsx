import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  TextInput,
  TextArea,
  Toggle,
  Button,
  FormGroup,
  Select,
  SelectItem,
  Tile,
  Checkbox,
  Layer,
} from '@carbon/react';
import { showNotification, showSnackbar } from '@openmrs/esm-framework';
import { updateSyncProfile, createSyncProfile, testSyncConnection } from './sync-profiles.resources';
import { type SyncFhirProfile, type SyncProfileFormData } from './sync-profiles.types';
import styles from './profile-detail-modal.scss';

interface ProfileDetailModalProps {
  open: boolean;
  onClose: () => void;
  profile?: SyncFhirProfile;
  onSave: () => void;
}

const resourceTypes = [
  'Patient',
  'Encounter',
  'Observation',
  'Condition',
  'MedicationRequest',
  'Location',
  'Practitioner',
  'Organization',
];

const syncFrequencies = [
  { value: '5m', label: 'Every 5 minutes' },
  { value: '15m', label: 'Every 15 minutes' },
  { value: '30m', label: 'Every 30 minutes' },
  { value: '1h', label: 'Every hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '12h', label: 'Every 12 hours' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
  { value: 'manual', label: 'Manual only' },
];

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  open,
  onClose,
  profile,
  onSave,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SyncProfileFormData>({
    name: '',
    description: '',
    profileEnabled: true,
    serverUrl: '',
    username: '',
    password: '',
    syncFrequency: 'manual',
    resourceTypes: [],
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        profileEnabled: profile.profileEnabled,
        serverUrl: profile.serverUrl || '',
        username: profile.username || '',
        password: '', // Don't pre-fill password for security
        syncFrequency: profile.syncFrequency || 'manual',
        resourceTypes: profile.resourceTypes || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        profileEnabled: true,
        serverUrl: '',
        username: '',
        password: '',
        syncFrequency: 'manual',
        resourceTypes: [],
      });
    }
    setTestResult(null);
  }, [profile, open]);

  const handleChange = (field: keyof SyncProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleResourceTypeChange = (resourceType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      resourceTypes: checked
        ? [...(prev.resourceTypes || []), resourceType]
        : (prev.resourceTypes || []).filter(rt => rt !== resourceType),
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (profile?.uuid) {
        await testSyncConnection(profile.uuid);
        setTestResult({ success: true, message: t('connectionSuccessful', 'Connection successful!') });
      }
    } catch (error) {
      setTestResult({ success: false, message: t('connectionFailed', 'Connection failed: ') + error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      if (profile?.uuid) {
        await updateSyncProfile(profile.uuid, formData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('profileUpdated', 'Profile updated'),
          subtitle: t('profileUpdatedSuccess', 'Sync profile has been updated successfully'),
          autoClose: true,
        });
      } else {
        await createSyncProfile(formData);
        showSnackbar({
          isLowContrast: true,
          kind: 'success',
          title: t('profileCreated', 'Profile created'),
          subtitle: t('profileCreatedSuccess', 'Sync profile has been created successfully'),
          autoClose: true,
        });
      }
      onSave();
      onClose();
    } catch (error) {
      showNotification({
        title: t('errorSavingProfile', 'Error saving profile'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.name && formData.serverUrl;

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading={profile ? t('editSyncProfile', 'Edit Sync Profile') : t('createSyncProfile', 'Create Sync Profile')}
      modalLabel={t('syncConfiguration', 'Sync Configuration')}
      primaryButtonText={t('save', 'Save')}
      secondaryButtonText={t('cancel', 'Cancel')}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={!isFormValid || isSaving || isTesting}
      size="lg"
    >
      <div className={styles.modalContent}>
        <FormGroup legendText={t('profileDetails', 'Profile Details')}>
          <TextInput
            id="profile-name"
            labelText={t('profileName', 'Profile Name')}
            placeholder={t('enterProfileName', 'Enter profile name')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className={styles.formField}
          />

          <TextArea
            id="profile-description"
            labelText={t('description', 'Description')}
            placeholder={t('enterDescription', 'Enter description')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={styles.formField}
          />

          <Toggle
            id="profile-enabled"
            labelText={t('profileEnabled', 'Profile Enabled')}
            toggled={formData.profileEnabled}
            onToggle={(checked) => handleChange('profileEnabled', checked)}
            className={styles.formField}
          />
        </FormGroup>

        <FormGroup legendText={t('connectionSettings', 'Connection Settings')}>
          <TextInput
            id="server-url"
            labelText={t('serverUrl', 'Server URL')}
            placeholder="https://fhir.example.com"
            value={formData.serverUrl}
            onChange={(e) => handleChange('serverUrl', e.target.value)}
            required
            className={styles.formField}
          />

          <TextInput
            id="username"
            labelText={t('username', 'Username')}
            placeholder={t('enterUsername', 'Enter username')}
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={styles.formField}
          />

          <TextInput
            id="password"
            type="password"
            labelText={t('password', 'Password')}
            placeholder={t('enterPassword', 'Enter password')}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={styles.formField}
          />

          {profile?.uuid && (
            <Button
              kind="secondary"
              onClick={handleTestConnection}
              disabled={isTesting || !formData.serverUrl}
              className={styles.testButton}
            >
              {isTesting ? t('testing', 'Testing...') : t('testConnection', 'Test Connection')}
            </Button>
          )}

          {testResult && (
            <Tile className={styles.testResult}>
              <div className={testResult.success ? styles.success : styles.error}>
                {testResult.message}
              </div>
            </Tile>
          )}
        </FormGroup>

        <FormGroup legendText={t('syncSettings', 'Sync Settings')}>
          <Select
            id="sync-frequency"
            labelText={t('syncFrequency', 'Sync Frequency')}
            value={formData.syncFrequency}
            onChange={(e) => handleChange('syncFrequency', e.target.value)}
            className={styles.formField}
          >
            {syncFrequencies.map(freq => (
              <SelectItem key={freq.value} value={freq.value} text={freq.label}>
                {freq.label}
              </SelectItem>
            ))}
          </Select>
        </FormGroup>

        <FormGroup legendText={t('resourceTypes', 'Resource Types to Sync')}>
          <div className={styles.resourceTypesGrid}>
            {resourceTypes.map(resource => (
              <Checkbox
                key={resource}
                id={`resource-${resource}`}
                labelText={resource}
                checked={formData.resourceTypes?.includes(resource)}
                onChange={(event) => handleResourceTypeChange(resource, (event.target as HTMLInputElement).checked)}
                className={styles.resourceCheckbox}
              />
            ))}
          </div>
        </FormGroup>
      </div>
    </Modal>
  );
};

export default ProfileDetailModal;
