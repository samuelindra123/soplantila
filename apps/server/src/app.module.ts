import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { appConfig } from './config/app.config';
import { validateEnv } from './config/env.validation';
import { jwtConfig } from './config/jwt.config';
import { mailConfig } from './config/mail.config';
import { uploadConfig } from './config/upload.config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { OtpModule } from './modules/otp/otp.module';
import { PostsModule } from './modules/posts/posts.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, jwtConfig, mailConfig, uploadConfig],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    QueueModule,
    UsersModule,
    OtpModule,
    MailModule,
    UploadModule,
    AuthModule,
    OnboardingModule,
    HealthModule,
    PostsModule,
    ProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
