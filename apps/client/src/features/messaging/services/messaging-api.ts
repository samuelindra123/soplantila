import { apiClient } from '@/lib/api-client';
import type { Message, Conversation, MessageType } from '@/types/message';

export const messagingApi = {
  async sendMessage(data: {
    receiverId: string;
    content?: string;
    messageType: MessageType;
    mediaUrl?: string;
    thumbnailUrl?: string;
  }): Promise<Message> {
    const response = await apiClient.post<Message>('/messages', data);
    return response;
  },

  async getConversation(otherUserId: string, limit = 50): Promise<Message[]> {
    const response = await apiClient.get<Message[]>(
      `/messages/conversation/${otherUserId}?limit=${limit}`,
    );
    return response;
  },

  async getConversationList(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/messages/conversations');
    return response;
  },

  async markAsRead(otherUserId: string) {
    const response = await apiClient.post(`/messages/mark-read/${otherUserId}`);
    return response;
  },

  async canSendMessage(receiverId: string): Promise<{ canSend: boolean }> {
    const response = await apiClient.get<{ canSend: boolean }>(`/messages/can-send/${receiverId}`);
    return response;
  },
};
