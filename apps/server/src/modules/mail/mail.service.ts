import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow<string>('mail.resendApiKey'));
    this.from = this.configService.getOrThrow<string>('mail.from');
  }

  async sendEmailVerificationOtp(email: string, otpCode: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Email verification</h2>
            <p>Use the OTP below to verify your account.</p>
            <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otpCode}</p>
            <p>This code expires in a few minutes. If you did not request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new InternalServerErrorException('Unable to send verification email.');
    }
  }
}
