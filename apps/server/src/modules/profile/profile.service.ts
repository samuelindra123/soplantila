import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.profile) {
      throw new NotFoundException('Profile not found. Please complete onboarding first.');
    }

    return {
      id: user.id,
      email: user.email,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        username: user.profile.username,
        bio: user.profile.bio,
        pekerjaan: user.profile.pekerjaan,
        tempatLahir: user.profile.tempatLahir,
        tanggalLahir: user.profile.tanggalLahir,
        gender: user.profile.gender,
        fotoProfilUrl: user.profile.fotoProfilUrl,
        coverImageUrl: user.profile.coverImageUrl,
      },
      stats: {
        posts: user._count.posts,
        followers: user._count.followers,
        following: user._count.following,
      },
    };
  }

  async getProfileByUsername(username: string) {
    const profile = await this.prisma.onboardingProfile.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            _count: {
              select: {
                posts: true,
                followers: true,
                following: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: profile.user.id,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        bio: profile.bio,
        pekerjaan: profile.pekerjaan,
        tempatLahir: profile.tempatLahir,
        tanggalLahir: profile.tanggalLahir,
        gender: profile.gender,
        fotoProfilUrl: profile.fotoProfilUrl,
        coverImageUrl: profile.coverImageUrl,
      },
      stats: {
        posts: profile.user._count.posts,
        followers: profile.user._count.followers,
        following: profile.user._count.following,
      },
    };
  }
}
