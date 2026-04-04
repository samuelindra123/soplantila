import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import { AUTH_MESSAGES } from './constants/auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';

@Injectable()
export class AuthService {
  private readonly passwordSaltRounds: number;
  private readonly exposeOtpInResponse: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.passwordSaltRounds = Number(
      this.configService.get<number>('PASSWORD_SALT_ROUNDS', 12),
    );
    this.exposeOtpInResponse = this.configService.get<boolean>(
      'app.authExposeOtpInResponse',
      false,
    );
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.passwordSaltRounds);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            status: UserStatus.PENDING_VERIFICATION,
          },
        });

        const { code } = await this.otpService.createEmailVerificationOtp(user.id, tx);

        return {
          user,
          code,
        };
      });

      await this.mailService.sendEmailVerificationOtp(result.user.email, result.code);

      return {
        message: AUTH_MESSAGES.REGISTERED,
        data: {
          userId: result.user.id,
          email: result.user.email,
          status: result.user.status,
          ...(this.exposeOtpInResponse ? { otpPreview: result.code } : {}),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered.');
      }

      throw error;
    }
  }

  async verifyEmailOtp(dto: VerifyEmailOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('OTP is invalid or already expired.');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email has already been verified.');
    }

    await this.otpService.verifyEmailOtp(user.id, dto.otpCode);

    const nextStatus = user.onboardingCompleted
      ? UserStatus.ACTIVE
      : UserStatus.ONBOARDING_IN_PROGRESS;

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        status: nextStatus,
      },
      include: { profile: true },
    });

    const accessToken = await this.signAccessToken(updatedUser.id, updatedUser.email, {
      status: updatedUser.status,
    });

    return {
      message: AUTH_MESSAGES.OTP_VERIFIED,
      data: {
        accessToken,
        tokenType: 'Bearer',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          status: updatedUser.status,
          onboardingCompleted: updatedUser.onboardingCompleted,
        },
        nextStep: updatedUser.onboardingCompleted ? 'DASHBOARD' : 'COMPLETE_ONBOARDING',
      },
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user =
      (identifier.includes('@')
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByUsername(identifier)) ??
      (identifier.includes('@') ? null : await this.usersService.findByEmail(identifier));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email must be verified before logging in.');
    }

    const accessToken = await this.signAccessToken(user.id, user.email, {
      status: user.status,
    });

    return {
      message: 'Login successful.',
      data: {
        accessToken,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          onboardingCompleted: user.onboardingCompleted,
          profile: user.profile,
        },
        nextStep: this.resolveNextStep(user.status, user.onboardingCompleted),
      },
    };
  }

  async resendEmailOtp(dto: ResendEmailOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || user.emailVerifiedAt) {
      return {
        message: AUTH_MESSAGES.OTP_RESENT,
        data: {
          delivered: true,
        },
      };
    }

    const { code } = await this.otpService.resendEmailVerificationOtp(user.id);
    await this.mailService.sendEmailVerificationOtp(user.email, code);

    return {
      message: AUTH_MESSAGES.OTP_RESENT,
      data: {
        delivered: true,
        ...(this.exposeOtpInResponse ? { otpPreview: code } : {}),
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Authentication is invalid.');
    }

    return {
      message: 'Current user fetched successfully.',
      data: {
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted,
        profile: user.profile,
        nextStep: this.resolveNextStep(user.status, user.onboardingCompleted),
      },
    };
  }

  private async signAccessToken(
    userId: string,
    email: string,
    payload: { status: UserStatus },
  ): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      status: payload.status,
    });
  }

  private resolveNextStep(
    status: UserStatus,
    onboardingCompleted: boolean,
  ): 'VERIFY_EMAIL' | 'COMPLETE_ONBOARDING' | 'DASHBOARD' {
    if (status === UserStatus.PENDING_VERIFICATION) {
      return 'VERIFY_EMAIL';
    }

    if (!onboardingCompleted) {
      return 'COMPLETE_ONBOARDING';
    }

    return 'DASHBOARD';
  }
}
