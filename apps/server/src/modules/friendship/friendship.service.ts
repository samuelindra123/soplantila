import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendshipStatus, NotificationType } from '@prisma/client';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { UpdateFriendshipDto } from './dto/update-friendship.dto';

@Injectable()
export class FriendshipService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(userId: string, dto: SendFriendRequestDto) {
    const { addresseeId } = dto;

    if (userId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if addressee exists
    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
    });

    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId },
          { requesterId: addresseeId, addresseeId: userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new ConflictException('Friend request already sent');
      }
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Already friends');
      }
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('Cannot send friend request');
      }
    }

    // Create friendship
    const friendship = await this.prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        addressee: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: addresseeId,
        actorId: userId,
        type: NotificationType.FRIEND_REQUEST,
        friendshipId: friendship.id,
      },
    });

    return friendship;
  }

  async acceptFriendRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('You can only accept requests sent to you');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    const updatedFriendship = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        addressee: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Create notification for requester
    await this.prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        actorId: userId,
        type: NotificationType.FRIEND_ACCEPT,
        friendshipId: friendship.id,
      },
    });

    return updatedFriendship;
  }

  async rejectFriendRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('You can only reject requests sent to you');
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.REJECTED },
    });
  }

  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    if (
      friendship.requesterId !== userId &&
      friendship.addresseeId !== userId
    ) {
      throw new BadRequestException('You are not part of this friendship');
    }

    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { message: 'Friend removed successfully' };
  }

  async cancelFriendRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Hanya requester yang bisa cancel
    if (friendship.requesterId !== userId) {
      throw new BadRequestException('You can only cancel your own friend requests');
    }

    // Hanya bisa cancel jika masih pending
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending friend requests');
    }

    // Delete friendship dan notifikasi terkait
    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({
        where: {
          friendshipId: friendshipId,
        },
      }),
      this.prisma.friendship.delete({
        where: { id: friendshipId },
      }),
    ]);

    return { message: 'Friend request cancelled successfully' };
  }

  async getFriendshipStatus(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      return { status: 'self' };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      return { status: 'none', friendshipId: null };
    }

    return {
      status: friendship.status.toLowerCase(),
      friendshipId: friendship.id,
      isRequester: friendship.requesterId === userId,
    };
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: FriendshipStatus.ACCEPTED },
          { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
        ],
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        addressee: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return friendships.map((friendship) => {
      const friend =
        friendship.requesterId === userId
          ? friendship.addressee
          : friendship.requester;
      return {
        friendshipId: friendship.id,
        user: friend,
      };
    });
  }

  async getPendingRequests(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return friendships.map((friendship) => ({
      friendshipId: friendship.id,
      user: friendship.requester,
      createdAt: friendship.createdAt,
    }));
  }
}
