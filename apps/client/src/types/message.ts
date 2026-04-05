export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string | null;
  messageType: MessageType;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  status: MessageStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
      username: string;
      fotoProfilUrl: string | null;
    };
  };
  receiver: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
      username: string;
      fotoProfilUrl: string | null;
    };
  };
}

export interface Conversation {
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      username: string;
      fotoProfilUrl: string | null;
      bio: string | null;
    };
  };
  lastMessage: Message;
  unreadCount: number;
}
