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

export type MediaItem = {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  previewImageUrl?: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

export type Post = {
  id: string;
  user?: PostUser; // For compatibility
  author?: PostUser; // Backend sends this
  content: string;
  media?: string; // Legacy field
  mediaItems?: MediaItem[]; // New multi-media field
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isOwner?: boolean;
  createdAt: string;
};
