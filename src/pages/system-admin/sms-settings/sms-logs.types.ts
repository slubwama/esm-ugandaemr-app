export interface SmsLog {
  uuid: string;
  mobileNo: string;
  message: string;
  dateCreated: string;
}

export interface SmsLogResponse {
  results: Array<SmsLog>;
}
