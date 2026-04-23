import {
  Injectable, Logger, InternalServerErrorException, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

type TwilioClient = ReturnType<typeof twilio>;

@Injectable()
export class TwilioService {
  private client: TwilioClient | null = null;
  private verifyServiceSid = '';
  /** True when we accept DEV_OTP_CODE instead of Twilio Verify. */
  private readonly useOtpMock: boolean;
  private readonly logger = new Logger(TwilioService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const verifySid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    const twilioConfigured = !!(accountSid && authToken && verifySid);
    const forceDevMock =
      !isProd && this.configService.get<string>('FORCE_DEV_OTP_MOCK') === 'true';

    if (!twilioConfigured && isProd) {
      throw new Error(
        'Twilio is required in production: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID',
      );
    }

    this.useOtpMock = forceDevMock || !twilioConfigured;

    if (!twilioConfigured && !isProd) {
      this.logger.warn(
        'Twilio not configured — using development OTP mock (set DEV_OTP_CODE or default 123456)',
      );
    }

    if (forceDevMock && twilioConfigured) {
      this.logger.warn(
        'FORCE_DEV_OTP_MOCK=true — Twilio SMS bypassed; use DEV_OTP_CODE (default 123456)',
      );
    }

    if (!this.useOtpMock) {
      this.verifyServiceSid = verifySid!;
      this.client = twilio(accountSid!, authToken!);
      this.logger.log('Twilio client initialized');
    }
  }

  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    if (this.useOtpMock) {
      const devCode = this.configService.get<string>('DEV_OTP_CODE', '123456');
      this.logger.warn(`[DEV mock OTP] ${phone} — use code: ${devCode}`);
      return { success: true, message: 'OTP sent successfully' };
    }

    try {
      const verification = await this.client!.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
        });

      this.logger.log(`OTP sent to ${phone}, status: ${verification.status}`);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      const detail = error?.message || error?.moreInfo || String(error);
      this.logger.error(`Failed to send OTP to ${phone}: ${detail}`, error?.stack);

      const isProd = this.configService.get<string>('NODE_ENV') === 'production';
      if (!isProd) {
        throw new BadRequestException(
          `Twilio could not send SMS (${detail}). Trial accounts often only allow verified numbers; `
            + 'or set FORCE_DEV_OTP_MOCK=true in backend/.env and use DEV_OTP_CODE (default 123456).',
        );
      }
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  async verifyOtp(phone: string, code: string): Promise<{ success: boolean; valid: boolean }> {
    if (this.useOtpMock) {
      const expected = this.configService.get<string>('DEV_OTP_CODE', '123456');
      const valid = code === expected;
      this.logger.log(`[DEV mock OTP] ${phone}: ${valid ? 'approved' : 'rejected'}`);
      return { success: true, valid };
    }

    try {
      const verificationCheck = await this.client!.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phone,
          code: code,
        });

      const valid = verificationCheck.status === 'approved';
      this.logger.log(`OTP verification for ${phone}: ${verificationCheck.status}`);
      return { success: true, valid };
    } catch (error) {
      this.logger.error(`Failed to verify OTP for ${phone}`, error);
      return { success: false, valid: false };
    }
  }
}
