import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.profileService.getProfile(user.sub);

    return {
      message: 'Profile fetched successfully.',
      data: profile,
    };
  }

  @Get(':username')
  async getProfileByUsername(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const profile = await this.profileService.getProfileByUsername(username, user.sub);

    return {
      message: 'Profile fetched successfully.',
      data: profile,
    };
  }
}
