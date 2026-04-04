import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  }

  async findByUsername(username: string) {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!profile) {
      return null;
    }

    return this.findById(profile.userId);
  }

  async isUsernameTaken(username: string, excludingUserId?: string): Promise<boolean> {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!profile) {
      return false;
    }

    return profile.userId !== excludingUserId;
  }
}
