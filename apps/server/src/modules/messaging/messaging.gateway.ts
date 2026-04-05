import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
      console.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; message: SendMessageDto },
  ) {
    try {
      const { userId, message: messageDto } = data;
      const newMessage = await this.messagingService.sendMessage(
        userId,
        messageDto,
      );

      // Send to receiver
      this.server
        .to(`user:${messageDto.receiverId}`)
        .emit('newMessage', newMessage);

      // Send back to sender for confirmation
      client.emit('messageSent', newMessage);

      return { success: true, message: newMessage };
    } catch (error) {
      client.emit('messageError', {
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; typing: TypingIndicatorDto },
  ) {
    const { userId, typing } = data;
    const { targetId, isTyping } = typing;

    await this.messagingService.updateTypingIndicator(
      userId,
      targetId,
      isTyping,
    );

    // Notify the target user
    this.server.to(`user:${targetId}`).emit('userTyping', {
      userId,
      isTyping,
    });

    return { success: true };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; otherUserId: string },
  ) {
    const { userId, otherUserId } = data;
    await this.messagingService.markAsRead(userId, otherUserId);

    // Notify the other user that messages were read
    this.server.to(`user:${otherUserId}`).emit('messagesRead', {
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; otherUserId: string },
  ) {
    const conversationRoom = this.getConversationRoom(
      data.userId,
      data.otherUserId,
    );
    client.join(conversationRoom);
    return { success: true, room: conversationRoom };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; otherUserId: string },
  ) {
    const conversationRoom = this.getConversationRoom(
      data.userId,
      data.otherUserId,
    );
    client.leave(conversationRoom);
    return { success: true };
  }

  private getConversationRoom(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `conversation:${sorted[0]}:${sorted[1]}`;
  }
}
