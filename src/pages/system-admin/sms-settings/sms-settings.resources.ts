import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';
import { SMSSettings, DEFAULT_SMS_SETTINGS } from './sms-settings.types';

// Global Property Keys from backend
const GP_KEYS = {
  APPOINTMENT_REMINDER_ENABLED: 'ugandaemrsync.smsAppointmentReminder.enabled',
  APPOINTMENT_REMINDER_URL: 'ugandaemrsync.smsAppointmentReminder.server.url',
  LAST_SUCCESSFUL_DATE: 'ugandaemrsync.smsAppointmentReminder.last.successful.submission.date',
  SMS_SERVER_URL: 'ugandaemrsync.sms.server.url',
  SMS_USERNAME: 'ugandaemrsync.sms.server.username',
  SMS_PASSWORD: 'ugandaemrsync.sms.server.password',
  SMS_API_TOKEN: 'ugandaemrsync.sms.server.token',
  SMS_GATEWAY_ENABLED: 'ugandaemrsync.smsGateway.enabled',
  SMS_GATEWAY_URL: 'ugandaemrsync.smsGateway.url',
  SMS_GATEWAY_USERNAME: 'ugandaemrsync.smsGateway.username',
  SMS_GATEWAY_PASSWORD: 'ugandaemrsync.smsGateway.password',
  SUBMIT_ONCE_DAILY: 'ugandaemrsync.smsAppointmentReminder.submit.once.daily',
};

export function useSMSSettings() {
  const apiUrl = '/ws/rest/v1/ugandaemrsync/sms/settings';
  const { data, error, isLoading, mutate } = useSWR<SMSSettings, Error>(
    apiUrl,
    async (url) => {
      try {
        const response = await openmrsFetch(url);
        if (response.ok) {
          const data = await response.json();
          return data.results || DEFAULT_SMS_SETTINGS;
        }
        return DEFAULT_SMS_SETTINGS;
      } catch (error) {
        console.error('Error fetching SMS settings:', error);
        return DEFAULT_SMS_SETTINGS;
      }
    }
  );

  return {
    smsSettings: data || DEFAULT_SMS_SETTINGS,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function updateSMSSettings(settings: Partial<SMSSettings>) {
  try {
    const response = await openmrsFetch('/ws/rest/v1/ugandaemrsync/sms/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update SMS settings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    throw error;
  }
}

export async function updateGlobalProperty(property: string, value: string) {
  try {
    const response = await openmrsFetch(`/ws/rest/v1/ugandaemrsync/globalproperty/${property}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update global property ${property}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating global property ${property}:`, error);
    throw error;
  }
}

export async function testSMSConnection(settings: SMSSettings) {
  try {
    const response = await openmrsFetch('/ws/rest/v1/ugandaemrsync/sms/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverUrl: settings.smsServerUrl,
        username: settings.smsUsername,
        password: settings.smsPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`SMS connection test failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error testing SMS connection:', error);
    throw error;
  }
}
