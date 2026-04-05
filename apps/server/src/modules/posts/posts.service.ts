import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType, PostStatus, ProcessingStatus } from '@prisma/client';
import { FeedEventsService } from './feed-events.service';

export interface CreatePostMedia {
  mediaType: 'image' | 'video';
  storageKey: string;
  publicUrl: string;
  previewImageUrl?: string;
  mimeType: string;
  fileSize: number;
  originalName?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface InstantPostMedia {
  mediaType: 'image' | 'video';
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
  previewImageUrl?: string; // Thumbnail/poster URL for videos
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedEventsService: FeedEventsService,
  ) {}

  /**
   * INSTANT POST - Upload media langsung, post langsung PUBLISHED
   * 
   * Ini adalah flow utama untuk UX instant:
   * 1. Media sudah diupload ke storage sebelum method ini dipanggil
   * 2. Post langsung dibuat dengan status PUBLISHED
   * 3. Muncul di feed INSTANT tanpa menunggu background processing
   */
  async createInstantPost(
    userId: string,
    content: string,
    mediaItems?: InstantPostMedia[],
  ) {
    console.log('[PostsService] Creating instant post:', { 
      userId, 
      contentLength: content.length, 
      mediaCount: mediaItems?.length || 0 
    });

    // Validate content - minimal content atau media harus ada
    if (!content.trim() && (!mediaItems || mediaItems.length === 0)) {
      throw new BadRequestException('Post must have content or media.');
    }

    // Create post with PUBLISHED status immediately
    const post = await this.prisma.post.create({
      data: {
        userId,
        content: content.trim(),
        status: PostStatus.PUBLISHED,
        processingStatus: ProcessingStatus.COMPLETED,
        mediaUrl: mediaItems && mediaItems.length > 0 ? mediaItems[0].publicUrl : undefined,
        media: mediaItems && mediaItems.length > 0
          ? {
              create: mediaItems.map((m, index) => ({
                mediaType: m.mediaType === 'image' ? MediaType.IMAGE : MediaType.VIDEO,
                storageKey: m.storageKey,
                publicUrl: m.publicUrl,
                previewImageUrl: m.previewImageUrl, // Thumbnail for videos
                mimeType: m.mimeType,
                fileSize: m.fileSize,
                originalName: m.originalName,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    console.log('[PostsService] Instant post created:', { 
      postId: post.id, 
      status: post.status,
      mediaCount: post.media.length,
    });

    // Format post untuk response dan broadcast
    const formattedPost = this.formatPost(post, userId);

    // Broadcast new post event via SSE
    this.feedEventsService.broadcastNewPost(post.id, userId, formattedPost);

    return formattedPost;
  }

  /**
   * Create draft post - immediately saved to DB with DRAFT status
   * Media upload will be processed in background queue
   * 
   * OPTIMIZATION: Posts without media are published immediately
   */
  async createDraftPost(userId: string, content: string, uploadIds?: string[]) {
    console.log('[PostsService] Creating draft post:', { 
      userId, 
      contentLength: content.length, 
      uploadIdsCount: uploadIds?.length || 0 
    });

    // OPTIMIZATION: If no media, publish immediately (no need for queue)
    if (!uploadIds || uploadIds.length === 0) {
      console.log('[PostsService] No media, publishing immediately');
      
      const post = await this.prisma.post.create({
        data: {
          userId,
          content,
          status: PostStatus.PUBLISHED, // ✅ Langsung PUBLISHED
          processingStatus: ProcessingStatus.COMPLETED,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          media: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      console.log('[PostsService] Post published immediately:', { 
        postId: post.id, 
        status: post.status 
      });

      // Format post untuk broadcast
      const formattedPost = this.formatPost(post, userId);

      // Broadcast new post event via SSE
      this.feedEventsService.broadcastNewPost(post.id, userId, formattedPost);

      return {
        postId: post.id,
        status: post.status,
        processingStatus: post.processingStatus,
        uploadIds: [],
      };
    }

    // With media: Create DRAFT and process in background queue
    console.log('[PostsService] Has media, creating draft for queue processing');
    
    const post = await this.prisma.post.create({
      data: {
        userId,
        content,
        status: PostStatus.DRAFT,
        processingStatus: ProcessingStatus.PENDING,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    console.log('[PostsService] Draft post created for queue:', { 
      postId: post.id, 
      status: post.status,
      processingStatus: post.processingStatus 
    });

    return {
      postId: post.id,
      status: post.status,
      processingStatus: post.processingStatus,
      uploadIds: uploadIds || [],
    };
  }

  async findDraftPosts(userId: string) {
    return this.prisma.post.findMany({
      where: {
        userId,
        status: PostStatus.DRAFT,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPost(
    userId: string,
    content: string,
    media?: CreatePostMedia[],
  ) {
    console.log('[PostsService] Creating post:', { userId, contentLength: content.length, mediaCount: media?.length || 0 });
    
    const post = await this.prisma.post.create({
      data: {
        userId,
        content,
        // Keep mediaUrl for backward compatibility (first media URL)
        mediaUrl: media && media.length > 0 ? media[0].publicUrl : undefined,
        // Create PostMedia records
        media: media && media.length > 0
          ? {
              create: media.map((m, index) => ({
                mediaType: m.mediaType === 'image' ? MediaType.IMAGE : MediaType.VIDEO,
                storageKey: m.storageKey,
                publicUrl: m.publicUrl,
                previewImageUrl: m.previewImageUrl,
                mimeType: m.mimeType,
                fileSize: m.fileSize,
                originalName: m.originalName,
                width: m.width,
                height: m.height,
                duration: m.duration,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
        likes: {
          where: { userId },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId },
          select: { userId: true },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    console.log('[PostsService] Post created successfully:', { postId: post.id, createdAt: post.createdAt });
    
    return this.formatPost(post, userId);
  }

  async getFeed(currentUserId: string, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(50, Math.max(1, limit)) : 20;
    const skip = (safePage - 1) * safeLimit;

    console.log('[PostsService] Getting feed:', { currentUserId, page: safePage, limit: safeLimit, skip });

    // Debug: Check all posts status
    const allPostsCount = await this.prisma.post.groupBy({
      by: ['status'],
      _count: true,
    });
    console.log('[PostsService] All posts by status:', allPostsCount);

    // Only show PUBLISHED posts in feed
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          status: PostStatus.PUBLISHED,
        },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
          likes: {
            where: { userId: currentUserId },
            select: { userId: true },
          },
          bookmarks: {
            where: { userId: currentUserId },
            select: { userId: true },
          },
          media: {
            orderBy: { sortOrder: 'asc' },
          },
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
        },
      }),
    ]);

    console.log('[PostsService] Feed fetched:', { 
      postsCount: posts.length, 
      total, 
      firstPostId: posts[0]?.id,
      firstPostCreatedAt: posts[0]?.createdAt 
    });

    return {
      posts: posts.map((post) => this.formatPost(post, currentUserId)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
        hasMore: safePage * safeLimit < total,
      },
    };
  }

  async getUserPosts(userId: string, currentUserId?: string, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, limit)) : 20;
    const skip = (safePage - 1) * safeLimit;

    // Show PUBLISHED posts, or DRAFT/PROCESSING if viewing own profile
    const whereClause = currentUserId === userId 
      ? { userId }
      : { userId, status: PostStatus.PUBLISHED };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { userId: true },
              }
            : false,
          bookmarks: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { userId: true },
              }
            : false,
          media: {
            orderBy: { sortOrder: 'asc' },
          },
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);

    return {
      posts: posts.map((post) => this.formatPost(post, currentUserId)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async getPostById(postId: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { userId: true },
            }
          : false,
        bookmarks: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { userId: true },
            }
          : false,
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return this.formatPost(post, currentUserId);
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { media: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post.');
    }

    // Delete post (cascades to PostMedia)
    await this.prisma.post.delete({
      where: { id: postId },
    });

    // Return storage keys for cleanup by caller
    return {
      message: 'Post deleted successfully.',
      storageKeys: post.media.map((m) => m.storageKey),
    };
  }
  async updatePost(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this post.');
    }

    // Update only content, media cannot be changed
    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            emailVerifiedAt: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                username: true,
                fotoProfilUrl: true,
              },
            },
          },
        },
        media: true,
        likes: {
          where: { userId },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Broadcast update event
    this.feedEventsService.broadcastUpdatePost(postId, userId, {
      content: updatedPost.content,
    });

    return {
      message: 'Post updated successfully.',
      data: this.formatPost(updatedPost, userId),
    };
  }


  private formatPost(
    post: {
      id: string;
      userId: string;
      content: string;
      mediaUrl: string | null;
      commentsCount: number;
      status: PostStatus;
      processingStatus: ProcessingStatus | null;
      processingError: string | null;
      createdAt: Date;
      updatedAt?: Date;
      _count: {
        likes: number;
      };
      likes?: Array<{
        userId: string;
      }>;
      bookmarks?: Array<{
        userId: string;
      }>;
      media?: Array<{
        id: string;
        mediaType: MediaType;
        publicUrl: string;
        previewImageUrl: string | null;
        mimeType: string;
        fileSize: number;
        width: number | null;
        height: number | null;
        duration: number | null;
        sortOrder: number;
      }>;
      user: {
        id: string;
        emailVerifiedAt: Date | null;
        profile: {
          firstName: string;
          lastName: string;
          username: string;
          fotoProfilUrl: string | null;
        } | null;
      };
    },
    currentUserId?: string,
  ) {
    const profile = post.user.profile;
    const displayName = profile
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : 'Unknown';

    return {
      id: post.id,
      content: post.content,
      status: post.status,
      processingStatus: post.processingStatus,
      processingError: post.processingError,
      // Legacy single media field for backward compatibility
      mediaUrl: post.mediaUrl,
      // New multi-media array
      mediaItems: (post.media || []).map((m) => ({
        id: m.id,
        mediaType: m.mediaType.toLowerCase() as 'image' | 'video',
        url: m.publicUrl,
        previewImageUrl: m.previewImageUrl ?? undefined,
        mimeType: m.mimeType,
        fileSize: m.fileSize,
        width: m.width,
        height: m.height,
        duration: m.duration,
      })),
      likes: post._count.likes,
      comments: post.commentsCount,
      isLiked: Boolean(post.likes?.length),
      isBookmarked: Boolean(post.bookmarks?.length),
      isOwner: currentUserId ? post.userId === currentUserId : false,
      author: {
        id: post.user.id,
        displayName,
        username: profile?.username || 'unknown',
        avatarUrl: profile?.fotoProfilUrl ?? undefined,
        isVerified: Boolean(post.user.emailVerifiedAt),
      },
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt?.toISOString() ?? post.createdAt.toISOString(),
    };
  }
}
