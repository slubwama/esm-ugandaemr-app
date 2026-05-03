export interface SMSSettings {
  // Appointment Reminder Settings
  appointmentReminderEnabled: boolean;
  appointmentReminderServerUrl: string;
  lastSuccessfulSubmissionDate: string;

  // General SMS Settings
  smsServerUrl: string;
  smsUsername: string;
  smsPassword: string;
  smsApiToken: string;

  // SMS Gateway Settings
  smsGatewayEnabled: boolean;
  smsGatewayUrl: string;
  smsGatewayUsername: string;
  smsGatewayPassword: string;

  // Cohort/Configuration Settings
  appointmentReminderCohortUuid: string;
  dataExportReportDefinitionUuid: string;
  csvDesignUuid: string;

  // Schedule Settings
  submitOnceDaily: boolean;
  submissionInterval: number;
}

export interface GlobalProperty {
  uuid: string;
  property: string;
  value: string;
  description: string;
}

export interface SMSSettingsResponse {
  results: SMSSettings;
  success: boolean;
}

export const DEFAULT_SMS_SETTINGS: SMSSettings = {
  appointmentReminderEnabled: false,
  appointmentReminderServerUrl: '',
  lastSuccessfulSubmissionDate: '',
  smsServerUrl: '',
  smsUsername: '',
  smsPassword: '',
  smsApiToken: '',
  smsGatewayEnabled: false,
  smsGatewayUrl: '',
  smsGatewayUsername: '',
  smsGatewayPassword: '',
  appointmentReminderCohortUuid: 'c418984c-fe55-431a-90be-134da0a5ec67',
  dataExportReportDefinitionUuid: '9a4bfceb-6205-4811-9a09-f95589249f65',
  csvDesignUuid: 'e8cd7d9f-e30e-463f-8073-ea7ccf3d3574',
  submitOnceDaily: true,
  submissionInterval: 7,
};
