import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageType, FriendshipStatus } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(userId: string, dto: SendMessageDto) {
    const { receiverId, content, messageType, mediaUrl, thumbnailUrl } = dto;

    if (userId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check friendship status
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: userId },
        ],
      },
    });

    const areFriends = friendship?.status === FriendshipStatus.ACCEPTED;

    // If not friends, check message limit (1 message only)
    if (!areFriends) {
      const existingMessages = await this.prisma.message.count({
        where: {
          senderId: userId,
          receiverId: receiverId,
        },
      });

      if (existingMessages >= 1) {
        throw new ForbiddenException(
          'You can only send 1 message until friend request is accepted',
        );
      }
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content,
        messageType,
        mediaUrl,
        thumbnailUrl,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    return message;
  }

  async getConversation(userId: string, otherUserId: string, limit = 50) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        isDeleted: false,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages.reverse();
  }

  async getConversationList(userId: string) {
    // Get all users who have exchanged messages with current user
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        isDeleted: false,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get unique users and their last message
    const conversationMap = new Map();

    for (const message of messages) {
      const otherUser =
        message.senderId === userId ? message.receiver : message.sender;
      const otherUserId = otherUser.id;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
        });
      }
    }

    // Count unread messages
    for (const [otherUserId, conversation] of conversationMap.entries()) {
      const unreadCount = await this.prisma.message.count({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          status: { not: 'READ' },
          isDeleted: false,
        },
      });
      conversation.unreadCount = unreadCount;
    }

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
    );
  }

  async markAsRead(userId: string, otherUserId: string) {
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
      },
    });

    return { success: true };
  }

  async updateTypingIndicator(
    userId: string,
    targetId: string,
    isTyping: boolean,
  ) {
    if (isTyping) {
      await this.prisma.typingIndicator.upsert({
        where: {
          userId_targetId: {
            userId,
            targetId,
          },
        },
        create: {
          userId,
          targetId,
          isTyping: true,
        },
        update: {
          isTyping: true,
        },
      });
    } else {
      await this.prisma.typingIndicator.deleteMany({
        where: {
          userId,
          targetId,
        },
      });
    }

    return { success: true };
  }

  async canSendMessage(userId: string, receiverId: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: userId },
        ],
      },
    });

    const areFriends = friendship?.status === FriendshipStatus.ACCEPTED;

    if (areFriends) {
      return true;
    }

    const messageCount = await this.prisma.message.count({
      where: {
        senderId: userId,
        receiverId: receiverId,
      },
    });

    return messageCount < 1;
  }
}
