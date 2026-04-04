import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [UsersModule, UploadModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
