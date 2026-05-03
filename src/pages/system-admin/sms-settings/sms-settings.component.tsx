import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  TextInput,
  PasswordInput,
  NumberInput,
  Toggle,
  Tile,
  InlineLoading,
  InlineNotification,
  FormGroup,
  Layer,
} from '@carbon/react';
import {
  Save,
  Link,
  Information,
  Checkmark,
  Warning,
  Time,
} from '@carbon/react/icons';
import {
  showNotification,
  showSnackbar,
  useLayoutType,
} from '@openmrs/esm-framework';
import {
  useSMSSettings,
  updateSMSSettings,
  testSMSConnection,
} from './sms-settings.resources';
import { type SMSSettings } from './sms-settings.types';
import styles from './sms-settings.scss';

const SMSSettingsContent: React.FC = () => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { smsSettings, isLoading, isError, mutate } = useSMSSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [localSettings, setLocalSettings] = useState<SMSSettings>(smsSettings);

  const handleSettingChange = useCallback((key: keyof SMSSettings, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSMSSettings(localSettings);
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('smsSettingsSaved', 'SMS Settings Saved'),
        subtitle: t('smsSettingsSavedSuccess', 'SMS settings have been saved successfully'),
        autoClose: true,
      });
      mutate();
    } catch (error) {
      showNotification({
        title: t('errorSavingSmsSettings', 'Error Saving SMS Settings'),
        kind: 'error',
        critical: true,
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  }, [localSettings, mutate, t]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setConnectionStatus('idle');
    try {
      await testSMSConnection(localSettings);
      setConnectionStatus('success');
      showSnackbar({
        isLowContrast: true,
        kind: 'success',
        title: t('connectionSuccessful', 'Connection Successful'),
        subtitle: t('smsConnectionTestSuccess', 'Successfully connected to SMS server'),
        autoClose: true,
      });
    } catch (error) {
      setConnectionStatus('error');
      showNotification({
        title: t('connectionTestFailed', 'Connection Test Failed'),
        kind: 'error',
        description: error.message,
      });
    } finally {
      setIsTesting(false);
    }
  }, [localSettings, t]);

  const handleReset = useCallback(() => {
    setLocalSettings(smsSettings);
    setConnectionStatus('idle');
  }, [smsSettings]);

  if (isLoading) {
    return (
      <div className={styles.smsSettingsContent}>
        <InlineLoading description={t('loadingSmsSettings', 'Loading SMS settings...')} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.smsSettingsContent}>
        <InlineNotification
          kind="error"
          title={t('errorLoadingSmsSettings', 'Error loading SMS settings')}
          subtitle={t('failedToLoadSmsSettings', 'Failed to load SMS settings. Please try again.')}
        />
      </div>
    );
  }

  return (
    <div className={styles.smsSettingsContent}>
      <div className={styles.settingsContainer}>
        {/* Appointment Reminder Settings */}
        <Tile className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>{t('appointmentReminderSettings', 'Appointment Reminder Settings')}</h2>
              <p className={styles.sectionDescription}>
                {t('appointmentReminderSettingsDesc', 'Configure SMS appointment reminder functionality')}
              </p>
            </div>
          </div>

          {smsSettings.lastSuccessfulSubmissionDate && (
            <div className={styles.lastSyncInfo}>
              <Information size={20} className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>
                  {t('lastSuccessfulSubmission', 'Last Successful Submission')}
                </div>
                <div className={styles.infoValue}>
                  {new Date(smsSettings.lastSuccessfulSubmissionDate).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <Layer>
            <FormGroup legendText="">
              <div className={styles.settingsForm}>
                <Toggle
                  id="appointment-reminder-enabled"
                  labelText={t('enableAppointmentReminders', 'Enable Appointment Reminders')}
                  labelA={t('off', 'Off')}
                  labelB={t('on', 'On')}
                  toggled={localSettings.appointmentReminderEnabled}
                  onToggle={(checked) => handleSettingChange('appointmentReminderEnabled', checked)}
                />

                <TextInput
                  id="appointment-reminder-url"
                  labelText={t('appointmentReminderServerUrl', 'Appointment Reminder Server URL')}
                  value={localSettings.appointmentReminderServerUrl}
                  onChange={(e) => handleSettingChange('appointmentReminderServerUrl', e.target.value)}
                  placeholder="http://localhost:8000/api/sms/save"
                  disabled={!localSettings.appointmentReminderEnabled}
                />

                <Toggle
                  id="submit-once-daily"
                  labelText={t('submitOnceDaily', 'Submit Once Daily')}
                  labelA={t('off', 'Off')}
                  labelB={t('on', 'On')}
                  toggled={localSettings.submitOnceDaily}
                  onToggle={(checked) => handleSettingChange('submitOnceDaily', checked)}
                />

                <NumberInput
                  id="submission-interval"
                  label={t('submissionInterval', 'Submission Interval (Days)')}
                  value={localSettings.submissionInterval}
                  onChange={(event) => {
                    const target = event.target as HTMLInputElement;
                    handleSettingChange('submissionInterval', parseInt(target.value || '7'));
                  }}
                  min={1}
                  max={30}
                  disabled={!localSettings.submitOnceDaily}
                />
              </div>
            </FormGroup>
          </Layer>
        </Tile>

        {/* SMS Server Configuration */}
        <Tile className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>{t('smsServerConfiguration', 'SMS Server Configuration')}</h2>
              <p className={styles.sectionDescription}>
                {t('smsServerConfigurationDesc', 'Configure SMS gateway connection settings')}
              </p>
            </div>
            <div className={styles.connectionStatus}>
              <div
                className={`${styles.statusDot} ${
                  connectionStatus === 'success'
                    ? styles.connected
                    : connectionStatus === 'error'
                    ? styles.disconnected
                    : ''
                }`}
              />
              <span>
                {connectionStatus === 'success'
                  ? t('connected', 'Connected')
                  : connectionStatus === 'error'
                  ? t('connectionFailed', 'Connection Failed')
                  : t('notTested', 'Not Tested')}
              </span>
            </div>
          </div>

          <Layer>
            <FormGroup legendText="">
              <div className={styles.settingsForm}>
                <TextInput
                  id="sms-server-url"
                  labelText={t('smsServerUrl', 'SMS Server URL')}
                  value={localSettings.smsServerUrl}
                  onChange={(e) => handleSettingChange('smsServerUrl', e.target.value)}
                  placeholder="https://sms-gateway.example.com/api"
                />

                <TextInput
                  id="sms-username"
                  labelText={t('smsUsername', 'SMS Username')}
                  value={localSettings.smsUsername}
                  onChange={(e) => handleSettingChange('smsUsername', e.target.value)}
                  placeholder="username"
                />

                <PasswordInput
                  id="sms-password"
                  labelText={t('smsPassword', 'SMS Password')}
                  value={localSettings.smsPassword}
                  onChange={(e) => handleSettingChange('smsPassword', e.target.value)}
                  placeholder="password"
                />

                <TextInput
                  id="sms-api-token"
                  labelText={t('smsApiToken', 'SMS API Token')}
                  value={localSettings.smsApiToken}
                  onChange={(e) => handleSettingChange('smsApiToken', e.target.value)}
                  placeholder="your-api-token"
                />
              </div>
            </FormGroup>
          </Layer>

          <div className={styles.actionsBar}>
            <Button kind="tertiary" onClick={handleReset} disabled={isSaving || isTesting}>
              {t('reset', 'Reset')}
            </Button>
            <Button
              kind="secondary"
              onClick={handleTestConnection}
              disabled={isSaving || isTesting || !localSettings.smsServerUrl}
              renderIcon={Link}
            >
              {isTesting ? t('testing', 'Testing...') : t('testConnection', 'Test Connection')}
            </Button>
          </div>
        </Tile>

        {/* Advanced Configuration */}
        <Tile className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>{t('advancedConfiguration', 'Advanced Configuration')}</h2>
              <p className={styles.sectionDescription}>
                {t('advancedConfigurationDesc', 'Technical settings for SMS integration')}
              </p>
            </div>
          </div>

          <Layer>
            <FormGroup legendText="">
              <div className={styles.settingsForm}>
                <TextInput
                  id="cohort-uuid"
                  labelText={t('appointmentReminderCohortUuid', 'Appointment Reminder Cohort UUID')}
                  value={localSettings.appointmentReminderCohortUuid}
                  onChange={(e) => handleSettingChange('appointmentReminderCohortUuid', e.target.value)}
                  disabled
                />

                <TextInput
                  id="report-uuid"
                  labelText={t('dataExportReportUuid', 'Data Export Report UUID')}
                  value={localSettings.dataExportReportDefinitionUuid}
                  onChange={(e) => handleSettingChange('dataExportReportDefinitionUuid', e.target.value)}
                  disabled
                />

                <TextInput
                  id="csv-design-uuid"
                  labelText={t('csvDesignUuid', 'CSV Design UUID')}
                  value={localSettings.csvDesignUuid}
                  onChange={(e) => handleSettingChange('csvDesignUuid', e.target.value)}
                  disabled
                />
              </div>
            </FormGroup>
          </Layer>
        </Tile>

        {/* Save Actions */}
        <div className={styles.actionsBar}>
          <Button
            kind="primary"
            onClick={handleSave}
            disabled={isSaving || isTesting}
            renderIcon={Save}
          >
            {isSaving ? t('saving', 'Saving...') : t('saveSettings', 'Save Settings')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SMSSettingsContent;
