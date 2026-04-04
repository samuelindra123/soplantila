import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose, OtpStatus, Prisma } from '@prisma/client';
import { createHash, randomInt } from 'crypto';
import { addMinutes } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpService {
  private readonly otpSecret: string;
  private readonly otpLength: number;
  private readonly expiresMinutes: number;
  private readonly maxVerifyAttempts: number;
  private readonly resendCooldownSeconds: number;
  private readonly maxResends: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.otpSecret = this.configService.getOrThrow<string>('OTP_HASH_SECRET');
    this.otpLength = Number(this.configService.get<number>('OTP_LENGTH', 6));
    this.expiresMinutes = Number(
      this.configService.get<number>('OTP_EXPIRES_MINUTES', 10),
    );
    this.maxVerifyAttempts = Number(
      this.configService.get<number>('OTP_MAX_VERIFY_ATTEMPTS', 5),
    );
    this.resendCooldownSeconds = Number(
      this.configService.get<number>('OTP_RESEND_COOLDOWN_SECONDS', 60),
    );
    this.maxResends = Number(this.configService.get<number>('OTP_MAX_RESENDS', 5));
  }

  async createEmailVerificationOtp(userId: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    await this.expireStaleOtps(userId, prisma);

    await prisma.emailOtp.updateMany({
      where: {
        userId,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        status: OtpStatus.PENDING,
      },
      data: {
        status: OtpStatus.SUPERSEDED,
      },
    });

    const code = this.generateOtpCode();
    const now = new Date();

    const otp = await prisma.emailOtp.create({
      data: {
        userId,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        codeHash: this.hashOtpCode(code),
        expiresAt: addMinutes(now, this.expiresMinutes),
        lastSentAt: now,
      },
    });

    return {
      otp,
      code,
    };
  }

  async resendEmailVerificationOtp(userId: string) {
    await this.expireStaleOtps(userId, this.prisma);

    const existingOtp = await this.prisma.emailOtp.findFirst({
      where: {
        userId,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        status: OtpStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    if (existingOtp) {
      const cooldownMs = this.resendCooldownSeconds * 1_000;
      const nextAllowedResendAt = new Date(existingOtp.lastSentAt.getTime() + cooldownMs);

      if (nextAllowedResendAt > now) {
        throw new TooManyRequestsException(
          'OTP resend is temporarily throttled. Please try again later.',
        );
      }

      if (existingOtp.resendCount >= this.maxResends) {
        throw new TooManyRequestsException(
          'OTP resend limit has been reached. Please register again later.',
        );
      }

      const code = this.generateOtpCode();

      const otp = await this.prisma.emailOtp.update({
        where: { id: existingOtp.id },
        data: {
          codeHash: this.hashOtpCode(code),
          expiresAt: addMinutes(now, this.expiresMinutes),
          lastSentAt: now,
          resendCount: { increment: 1 },
          attemptCount: 0,
        },
      });

      return {
        otp,
        code,
      };
    }

    return this.createEmailVerificationOtp(userId);
  }

  async verifyEmailOtp(userId: string, code: string): Promise<void> {
    await this.expireStaleOtps(userId, this.prisma);

    const otp = await this.prisma.emailOtp.findFirst({
      where: {
        userId,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        status: OtpStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('OTP is invalid or already expired.');
    }

    if (otp.expiresAt <= new Date()) {
      await this.prisma.emailOtp.update({
        where: { id: otp.id },
        data: { status: OtpStatus.EXPIRED },
      });
      throw new BadRequestException('OTP is invalid or already expired.');
    }

    const submittedHash = this.hashOtpCode(code);

    if (submittedHash !== otp.codeHash) {
      const nextAttemptCount = otp.attemptCount + 1;

      await this.prisma.emailOtp.update({
        where: { id: otp.id },
        data: {
          attemptCount: nextAttemptCount,
          status:
            nextAttemptCount >= this.maxVerifyAttempts
              ? OtpStatus.FAILED
              : OtpStatus.PENDING,
        },
      });

      if (nextAttemptCount >= this.maxVerifyAttempts) {
        throw new TooManyRequestsException(
          'OTP verification attempt limit has been reached. Please request a new OTP.',
        );
      }

      throw new BadRequestException('OTP is invalid or already expired.');
    }

    await this.prisma.emailOtp.update({
      where: { id: otp.id },
      data: {
        verifiedAt: new Date(),
        status: OtpStatus.VERIFIED,
      },
    });
  }

  async expireStaleOtps(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.emailOtp.updateMany({
      where: {
        userId,
        status: OtpStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: OtpStatus.EXPIRED,
      },
    });
  }

  async cleanupExpiredOtps(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const result = await this.prisma.emailOtp.deleteMany({
      where: {
        OR: [
          { status: OtpStatus.EXPIRED },
          { status: OtpStatus.SUPERSEDED },
          { status: OtpStatus.FAILED },
        ],
        updatedAt: {
          lt: oneDayAgo,
        },
      },
    });

    return result.count;
  }

  private generateOtpCode(): string {
    const min = 10 ** (this.otpLength - 1);
    const max = 10 ** this.otpLength;

    return randomInt(min, max).toString();
  }

  private hashOtpCode(code: string): string {
    return createHash('sha256').update(`${code}:${this.otpSecret}`).digest('hex');
  }
}

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
