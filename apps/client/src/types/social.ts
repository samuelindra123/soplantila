export type PostUser = {
  id: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  fotoProfilUrl?: string | null;
  isVerified?: boolean;
};

export type Post = {
  id: string;
  user: PostUser;
  content: string;
  media?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
};
