/**
 * SMS Dispatch Service for Herbic Cure
 * 
 * SMS OTP service has been removed to eliminate SMS gateway fees and prevent bot spam.
 */

export interface SendSmsResult {
  success: boolean;
  message: string;
  simulated?: boolean;
  devOtp?: string;
}

export async function sendSmsOtp(): Promise<SendSmsResult> {
  return {
    success: false,
    message: 'SMS OTP service is disabled per store policy.',
  };
}
