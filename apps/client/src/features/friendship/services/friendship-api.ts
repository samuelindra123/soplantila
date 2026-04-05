import { apiClient } from '@/lib/api-client';
import type { FriendshipStatusResponse, Friend, PendingRequest } from '@/types/friendship';

export const friendshipApi = {
  async sendFriendRequest(addresseeId: string) {
    const response = await apiClient.post('/friendships/request', { addresseeId });
    return response;
  },

  async acceptFriendRequest(friendshipId: string) {
    const response = await apiClient.patch(`/friendships/${friendshipId}/accept`);
    return response;
  },

  async rejectFriendRequest(friendshipId: string) {
    const response = await apiClient.patch(`/friendships/${friendshipId}/reject`);
    return response;
  },

  async removeFriend(friendshipId: string) {
    const response = await apiClient.delete(`/friendships/${friendshipId}`);
    return response;
  },

  async cancelFriendRequest(friendshipId: string) {
    const response = await apiClient.delete(`/friendships/${friendshipId}/cancel`);
    return response;
  },

  async getFriendshipStatus(targetUserId: string): Promise<FriendshipStatusResponse> {
    const response = await apiClient.get<FriendshipStatusResponse>(`/friendships/status/${targetUserId}`);
    return response;
  },

  async getFriends(): Promise<Friend[]> {
    const response = await apiClient.get<Friend[]>('/friendships/friends');
    return response;
  },

  async getUserFriends(userId: string): Promise<Friend[]> {
    const response = await apiClient.get<Friend[]>(`/friendships/${userId}/friends`);
    return response;
  },

  async getPendingRequests(): Promise<PendingRequest[]> {
    const response = await apiClient.get<PendingRequest[]>('/friendships/pending');
    return response;
  },
};
