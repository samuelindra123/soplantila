export type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked' | 'self';

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  friendshipId: string | null;
  isRequester?: boolean;
}

export interface Friend {
  friendshipId: string;
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
}

export interface PendingRequest {
  friendshipId: string;
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
  createdAt: string;
}
