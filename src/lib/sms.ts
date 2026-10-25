/**
 * SMS Dispatch Service for Herbic Cure
 * 
 * Supports:
 * 1. Fast2SMS (Indian SMS Gateway) via FAST2SMS_API_KEY
 * 2. Twilio SMS via TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN
 * 3. Fallback Development / Demo Simulation mode when no SMS gateway keys are set.
 */

export interface SendSmsResult {
  success: boolean;
  message: string;
  simulated?: boolean;
  devOtp?: string;
}

import { logger, maskPhone } from '@/lib/logger';

export async function sendSmsOtp(phone: string, otp: string): Promise<SendSmsResult> {
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  const messageText = `Your Herbic Cure verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

  // 1. Fast2SMS integration (popular Indian SMS gateway)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: normalizedPhone,
        }),
      });

      const data = await response.json();
      if (data.return) {
        return {
          success: true,
          message: `OTP sent successfully to +91 ${normalizedPhone}`,
        };
      } else {
        logger.warn('sms.fast2sms.failed', { status: data?.status_code || 400 });
      }
    } catch (err: any) {
      logger.error('sms.fast2sms.error', { error: err?.message || 'Fast2SMS network error' });
    }
  }

  // 2. Twilio integration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('To', `+91${normalizedPhone}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', messageText);

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (response.ok) {
        return {
          success: true,
          message: `OTP sent successfully via Twilio to +91 ${normalizedPhone}`,
        };
      } else {
        logger.warn('sms.twilio.failed', { status: response.status });
      }
    } catch (err: any) {
      logger.error('sms.twilio.error', { error: err?.message || 'Twilio request error' });
    }
  }

  // 3. Simulated Demo / Development Fallback Mode (secure, no plaintext secrets logged)
  logger.debug('sms.dispatch.simulated', {
    phoneMasked: maskPhone(normalizedPhone),
  });

  return {
    success: true,
    message: `OTP sent to +91 ${normalizedPhone}`,
    simulated: true,
    devOtp: otp,
  };
}
