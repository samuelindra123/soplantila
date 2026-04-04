import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { RESERVED_USERNAMES } from '../../common/constants/security.constants';
import { isAtLeastAge } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import {
  CoverImageAction,
  UpdateOnboardingProfileDto,
} from './dto/update-onboarding-profile.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
    profileImage?: Express.Multer.File,
  ) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Authentication is invalid.');
    }

    if (!user.emailVerifiedAt) {
      throw new BadRequestException('Email must be verified before onboarding.');
    }

    const birthDate = new Date(dto.tanggalLahir);

    if (Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('tanggalLahir must be a valid date.');
    }

    if (!isAtLeastAge(birthDate, 13)) {
      throw new BadRequestException('Minimum age requirement is 13 years old.');
    }

    await this.assertUsernameAvailable(dto.username, userId);

    const previousProfileImageUrl = user.profile?.fotoProfilUrl ?? null;
    const profileImageUrl = await this.uploadService.uploadProfileImage(profileImage, userId);

    try {
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        await tx.onboardingProfile.upsert({
          where: { userId },
          update: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            username: dto.username,
            tanggalLahir: birthDate,
            tempatLahir: dto.tempatLahir,
            gender: dto.gender,
            pekerjaan: dto.pekerjaan,
            bio: dto.bio,
            ...(profileImageUrl
              ? { fotoProfilUrl: profileImageUrl }
              : previousProfileImageUrl
                ? { fotoProfilUrl: previousProfileImageUrl }
                : {}),
          },
          create: {
            userId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            username: dto.username,
            tanggalLahir: birthDate,
            tempatLahir: dto.tempatLahir,
            gender: dto.gender,
            pekerjaan: dto.pekerjaan,
            bio: dto.bio,
            fotoProfilUrl: profileImageUrl ?? undefined,
          },
        });

        return tx.user.update({
          where: { id: userId },
          data: {
            onboardingCompleted: true,
            status: UserStatus.ACTIVE,
          },
          include: { profile: true },
        });
      });

      if (
        profileImageUrl &&
        previousProfileImageUrl &&
        previousProfileImageUrl !== profileImageUrl
      ) {
        await this.uploadService
          .deleteProfileImage(previousProfileImageUrl)
          .catch((cleanupError: unknown) => {
            this.logger.warn(
              `Failed to delete previous profile image for user ${userId}: ${String(cleanupError)}`,
            );
          });
      }

      return {
        message: 'Onboarding completed successfully.',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            onboardingCompleted: updatedUser.onboardingCompleted,
            profile: updatedUser.profile,
          },
          nextStep: 'DASHBOARD',
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        if (profileImageUrl) {
          await this.uploadService.deleteProfileImage(profileImageUrl);
        }

        throw new ConflictException('Username is already in use.');
      }

      if (profileImageUrl) {
        await this.uploadService.deleteProfileImage(profileImageUrl);
      }

      this.logger.error(
        `completeOnboarding failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateOnboardingProfileDto,
    profileImage?: Express.Multer.File,
    coverImage?: Express.Multer.File,
  ) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Authentication is invalid.');
    }

    if (!user.profile) {
      throw new NotFoundException('Onboarding profile was not found.');
    }

    if (dto.username) {
      await this.assertUsernameAvailable(dto.username, userId);
    }

    const birthDate = dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined;

    if (birthDate && Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('tanggalLahir must be a valid date.');
    }

    if (birthDate && !isAtLeastAge(birthDate, 13)) {
      throw new BadRequestException('Minimum age requirement is 13 years old.');
    }

    const previousProfileImageUrl = user.profile.fotoProfilUrl ?? null;
    const previousCoverImageUrl = user.profile.coverImageUrl ?? null;
    const nextProfileImageUrl = await this.uploadService.uploadProfileImage(profileImage, userId);
    const nextCoverImageUrl = await this.uploadService.uploadCoverImage(coverImage, userId);
    const requestedCoverImageAction = dto.coverImageAction ?? CoverImageAction.KEEP;
    const resolvedCoverImageAction =
      requestedCoverImageAction === CoverImageAction.KEEP && nextCoverImageUrl
        ? CoverImageAction.REPLACE
        : requestedCoverImageAction;

    if (resolvedCoverImageAction === CoverImageAction.REPLACE && !nextCoverImageUrl) {
      throw new BadRequestException('Cover image file is required to replace cover.');
    }

    try {
      const coverImageUpdateData =
        resolvedCoverImageAction === CoverImageAction.REMOVE
          ? { coverImageUrl: null as string | null }
          : resolvedCoverImageAction === CoverImageAction.REPLACE && nextCoverImageUrl
            ? { coverImageUrl: nextCoverImageUrl }
            : {};
      const isCoverFieldUpdated =
        resolvedCoverImageAction === CoverImageAction.REMOVE ||
        (resolvedCoverImageAction === CoverImageAction.REPLACE && Boolean(nextCoverImageUrl));

      const updatedUser = await this.prisma.$transaction(async (tx) => {
        await tx.onboardingProfile.update({
          where: { userId },
          data: {
            ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
            ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
            ...(dto.username !== undefined ? { username: dto.username } : {}),
            ...(birthDate ? { tanggalLahir: birthDate } : {}),
            ...(dto.tempatLahir !== undefined ? { tempatLahir: dto.tempatLahir } : {}),
            ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
            ...(dto.pekerjaan !== undefined ? { pekerjaan: dto.pekerjaan } : {}),
            ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
            ...coverImageUpdateData,
            ...(nextProfileImageUrl ? { fotoProfilUrl: nextProfileImageUrl } : {}),
          },
        });

        return tx.user.findUniqueOrThrow({
          where: { id: userId },
          include: { profile: true },
        });
      });

      if (
        nextProfileImageUrl &&
        previousProfileImageUrl &&
        previousProfileImageUrl !== nextProfileImageUrl
      ) {
        await this.uploadService.deleteProfileImage(previousProfileImageUrl).catch(() => {
          this.logger.warn(
            `Failed to delete previous profile image for user ${userId} after profile update.`,
          );
        });
      }

      if (
        previousCoverImageUrl &&
        ((resolvedCoverImageAction === CoverImageAction.REMOVE) ||
          (resolvedCoverImageAction === CoverImageAction.REPLACE &&
            nextCoverImageUrl &&
            previousCoverImageUrl !== nextCoverImageUrl))
      ) {
        await this.uploadService.deleteProfileImage(previousCoverImageUrl).catch(() => {
          this.logger.warn(
            `Failed to delete previous cover image for user ${userId} after profile update.`,
          );
        });
      }

      this.logger.log(
        `updateProfile success for user ${userId}: coverAction=${resolvedCoverImageAction}, coverUpdated=${isCoverFieldUpdated}, hasNewCoverFile=${Boolean(nextCoverImageUrl)}`,
      );

      return {
        message: 'Profile updated successfully.',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            onboardingCompleted: updatedUser.onboardingCompleted,
            profile: updatedUser.profile,
          },
        },
      };
    } catch (error) {
      if (nextProfileImageUrl) {
        await this.uploadService.deleteProfileImage(nextProfileImageUrl);
      }
      if (nextCoverImageUrl) {
        await this.uploadService.deleteProfileImage(nextCoverImageUrl);
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username is already in use.');
      }

      this.logger.error(
        `updateProfile failed for user ${userId} with fields [${Object.keys(dto).join(', ') || 'none'}], hasProfileImage=${Boolean(profileImage)}, hasCoverImage=${Boolean(coverImage)}, requestedCoverImageAction=${requestedCoverImageAction}, resolvedCoverImageAction=${resolvedCoverImageAction}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async deleteProfileImage(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Authentication is invalid.');
    }

    if (!user.profile) {
      throw new NotFoundException('Onboarding profile was not found.');
    }

    const currentProfileImageUrl = user.profile.fotoProfilUrl;

    if (!currentProfileImageUrl) {
      return {
        message: 'Profile image deleted successfully.',
        data: {
          profileImageDeleted: false,
          profile: user.profile,
        },
      };
    }

    await this.prisma.onboardingProfile.update({
      where: { userId },
      data: {
        fotoProfilUrl: null,
      },
    });

    await this.uploadService.deleteProfileImage(currentProfileImageUrl).catch((cleanupError) => {
      this.logger.warn(
        `Failed to delete profile image for user ${userId}: ${String(cleanupError)}`,
      );
    });

    const refreshedUser = await this.usersService.findById(userId);

    return {
      message: 'Profile image deleted successfully.',
      data: {
        profileImageDeleted: true,
        profile: refreshedUser?.profile ?? null,
      },
    };
  }

  private async assertUsernameAvailable(username: string, userId: string): Promise<void> {
    if (RESERVED_USERNAMES.includes(username as (typeof RESERVED_USERNAMES)[number])) {
      throw new BadRequestException('Username is not allowed.');
    }

    const usernameTaken = await this.usersService.isUsernameTaken(username, userId);

    if (usernameTaken) {
      throw new ConflictException('Username is already in use.');
    }
  }
}
