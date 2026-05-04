import { openmrsFetch } from '@openmrs/esm-framework';
import { type SmsLog, type SmsLogResponse } from './sms-logs.types';

export function useSmsLogs() {
  const fetchSmsLogs = async () => {
    try {
      const response = await openmrsFetch('/ws/rest/v1/ugandaemrsync/smssent?v=full');
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      return [];
    }
  };

  return { fetchSmsLogs };
}
