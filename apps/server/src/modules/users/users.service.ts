import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('You are already following this user');
    }

    // Create follow relationship
    await this.prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: followingId,
        actorId: followerId,
        type: 'FOLLOW',
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Invalid operation');
    }

    // Check if following
    const existingFollow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException('You are not following this user');
    }

    // Delete follow relationship
    await this.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    // Create unfollow notification (optional - bisa dihapus jika tidak diinginkan)
    await this.prisma.notification.create({
      data: {
        userId: followingId,
        actorId: followerId,
        type: 'UNFOLLOW',
      },
    });
  }

  async getFollowers(userId: string) {
    const followers = await this.prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return followers.map((f) => ({
      id: f.follower.id,
      email: f.follower.email,
      profile: f.follower.profile,
    }));
  }

  async getFollowing(userId: string) {
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return following.map((f) => ({
      id: f.following.id,
      email: f.following.email,
      profile: f.following.profile,
    }));
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          actor: {
            include: {
              profile: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
            },
          },
          friendship: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    const formattedNotifications = notifications.map((notif) => ({
      id: notif.id,
      type: notif.type,
      isRead: notif.isRead,
      createdAt: notif.createdAt.toISOString(),
      actor: {
        id: notif.actor.id,
        username: notif.actor.profile?.username || 'unknown',
        firstName: notif.actor.profile?.firstName || '',
        lastName: notif.actor.profile?.lastName || '',
        fotoProfilUrl: notif.actor.profile?.fotoProfilUrl || null,
      },
      post: notif.post
        ? {
            id: notif.post.id,
            content: notif.post.content.substring(0, 100),
          }
        : null,
      friendship: notif.friendship
        ? {
            id: notif.friendship.id,
          }
        : null,
    }));

    return {
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}
