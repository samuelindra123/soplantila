import {
  Body,
  Controller,
  Delete,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateOnboardingProfileDto } from './dto/update-onboarding-profile.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @UseInterceptors(
    FileInterceptor('fotoProfil', {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  completeProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteOnboardingDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    return this.onboardingService.completeOnboarding(user.sub, dto, profileImage);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'fotoProfil', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
      ],
      {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOnboardingProfileDto,
    @UploadedFiles()
    files?: {
      fotoProfil?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
  ) {
    return this.onboardingService.updateProfile(
      user.sub,
      dto,
      files?.fotoProfil?.[0],
      files?.coverImage?.[0],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile-image')
  deleteProfileImage(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.deleteProfileImage(user.sub);
  }
}
