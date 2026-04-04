import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({
    default: {
      ttl: 300_000,
      limit: 5,
    },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-otp')
  @Throttle({
    default: {
      ttl: 300_000,
      limit: 10,
    },
  })
  verifyOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(dto);
  }

  @Post('resend-otp')
  @Throttle({
    default: {
      ttl: 300_000,
      limit: 5,
    },
  })
  resendOtp(@Body() dto: ResendEmailOtpDto) {
    return this.authService.resendEmailOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.sub);
  }
}
