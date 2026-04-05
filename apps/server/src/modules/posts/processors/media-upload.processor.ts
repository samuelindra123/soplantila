import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { MediaUploadService } from '../../upload/media-upload.service';
import { PostStatus, ProcessingStatus, MediaType } from '@prisma/client';
import { FeedEventsService } from '../feed-events.service';
import { UploadHistoryService } from '../upload-history.service';

interface MediaUploadJobData {
  postId: string;
  userId: string;
  uploadIds: string[];
}

@Processor('media-upload')
export class MediaUploadProcessor {
  private readonly logger = new Logger(MediaUploadProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly feedEventsService: FeedEventsService,
    private readonly uploadHistoryService: UploadHistoryService,
  ) {}

  @Process('process-media-upload')
  async handleMediaUpload(job: Job<MediaUploadJobData>) {
    const { postId, userId, uploadIds } = job.data;

    this.logger.log(`[Job ${job.id}] Processing media upload for post: ${postId}`);
    this.logger.log(`[Job ${job.id}] Upload IDs: ${uploadIds.length}`);

    let historyId: string | null = null;

    try {
      // Get post content for history
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { content: true },
      });

      // Check if upload history already exists for this post (for retries)
      const existingHistory = await this.prisma.uploadHistory.findFirst({
        where: {
          userId,
          postId: null, // Not yet linked to post
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingHistory) {
        historyId = existingHistory.id;
        this.logger.log(`[Job ${job.id}] Reusing existing upload history: ${historyId}`);
        
        // Update status to processing
        await this.uploadHistoryService.updateHistory(historyId, {
          status: 'PROCESSING' as any,
        });
      } else if (uploadIds && uploadIds.length > 0) {
        // Create new upload history entry
        this.logger.log(`[Job ${job.id}] Creating upload history for ${uploadIds.length} uploads`);
        
        const tempUploads = await this.prisma.tempUpload.findMany({
          where: { id: { in: uploadIds } },
        });

        this.logger.log(`[Job ${job.id}] Found ${tempUploads.length} temp uploads`);

        const history = await this.uploadHistoryService.createHistory({
          userId,
          content: post?.content || '',
          mediaItems: tempUploads.map((upload, index) => ({
            mediaType: upload.mediaType,
            fileName: upload.originalName || 'unknown',
            fileSize: upload.fileSize,
            mimeType: upload.mimeType,
            sortOrder: index,
          })),
        });

        historyId = history.id;
        this.logger.log(`[Job ${job.id}] Created upload history: ${historyId}`);
      } else {
        this.logger.log(`[Job ${job.id}] No uploads, skipping history creation`);
      }

      // Update status to PROCESSING
      await this.prisma.post.update({
        where: { id: postId },
        data: { processingStatus: ProcessingStatus.PROCESSING },
      });

      // If no uploads, just publish the post
      if (!uploadIds || uploadIds.length === 0) {
        this.logger.log(`[Job ${job.id}] No media to process, publishing post`);
        
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            status: PostStatus.PUBLISHED,
            processingStatus: ProcessingStatus.COMPLETED,
          },
        });

        this.logger.log(`[Job ${job.id}] Post published successfully (no media)`);
        return { success: true, postId };
      }

      // Confirm each upload and collect media data
      const mediaItems: Array<{
        mediaType: MediaType;
        storageKey: string;
        publicUrl: string;
        previewImageUrl?: string;
        mimeType: string;
        fileSize: number;
        originalName: string | null;
        sortOrder: number;
      }> = [];

      // First, check if this post already has media attached (idempotency check)
      const existingPostMedia = await this.prisma.postMedia.findMany({
        where: { postId },
      });

      if (existingPostMedia.length > 0) {
        this.logger.log(`[Job ${job.id}] Post ${postId} already has ${existingPostMedia.length} media items attached`);
        
        // Check if post is already published
        const currentPost = await this.prisma.post.findUnique({
          where: { id: postId },
          select: { status: true, processingStatus: true },
        });

        if (currentPost?.status === PostStatus.PUBLISHED) {
          this.logger.log(`[Job ${job.id}] Post ${postId} already published, job is duplicate - skipping`);
          return { 
            success: true, 
            postId, 
            mediaCount: existingPostMedia.length,
            skipped: true,
          };
        }
      }

      for (let index = 0; index < uploadIds.length; index++) {
        const uploadId = uploadIds[index];
        
        this.logger.log(`[Job ${job.id}] Confirming upload ${index + 1}/${uploadIds.length}: ${uploadId}`);

        try {
          // Check if upload already confirmed
          const tempUpload = await this.prisma.tempUpload.findUnique({
            where: { id: uploadId },
          });

          if (!tempUpload) {
            throw new Error('Upload not found');
          }

          // If already confirmed, check if media already attached to this post
          if (tempUpload.confirmedAt) {
            this.logger.log(`[Job ${job.id}] Upload ${uploadId} already confirmed, checking PostMedia`);
            
            const existingMedia = await this.prisma.postMedia.findFirst({
              where: {
                postId: postId,
                storageKey: tempUpload.tempKey,
              },
            });

            if (existingMedia) {
              this.logger.log(`[Job ${job.id}] PostMedia already exists for upload ${uploadId}, skipping`);
              continue; // Skip this upload, it's already processed
            }

            // Check for legacy temp key format
            if (tempUpload.tempKey.startsWith('temp/')) {
              this.logger.error(`[Job ${job.id}] Upload ${uploadId} has legacy temp key format`);
              throw new Error('Upload already confirmed with legacy metadata. Please re-upload this media.');
            }

            // Upload confirmed but not yet attached to post - add to mediaItems
            this.logger.log(`[Job ${job.id}] Reusing confirmed upload metadata: ${uploadId}`);
            
            mediaItems.push({
              mediaType: tempUpload.mediaType,
              storageKey: tempUpload.tempKey,
              publicUrl: this.mediaUploadService.getPublicUrlForStorageKey(tempUpload.tempKey),
              previewImageUrl: undefined, // TODO: Generate preview for videos
              mimeType: tempUpload.mimeType,
              fileSize: tempUpload.fileSize,
              originalName: tempUpload.originalName,
              sortOrder: index,
            });

            continue;
          }

          const confirmed = await this.mediaUploadService.confirmUpload(userId, {
            uploadId,
          });

          mediaItems.push({
            mediaType: confirmed.mediaType,
            storageKey: confirmed.storageKey,
            publicUrl: confirmed.publicUrl,
            previewImageUrl: undefined, // TODO: Generate preview for videos
            mimeType: confirmed.mimeType,
            fileSize: confirmed.fileSize,
            originalName: confirmed.originalName,
            sortOrder: index,
          });

          this.logger.log(`[Job ${job.id}] Upload confirmed: ${uploadId}`);
        } catch (error) {
          this.logger.error(`[Job ${job.id}] Failed to confirm upload ${uploadId}: ${error.message}`);
          throw new Error(`Failed to confirm upload ${uploadId}: ${error.message}`);
        }
      }

      // Update post with media and publish
      // Use upsert pattern to handle potential race conditions
      const publishedPost = await this.prisma.$transaction(async (tx) => {
        // Check again if media already exists (race condition protection)
        const existingMedia = await tx.postMedia.findMany({
          where: { postId },
        });

        // If media already exists, just update post status
        if (existingMedia.length > 0) {
          this.logger.log(`[Job ${job.id}] Media already exists in transaction, updating post status only`);
          
          return await tx.post.update({
            where: { id: postId },
            data: {
              status: PostStatus.PUBLISHED,
              processingStatus: ProcessingStatus.COMPLETED,
              mediaUrl: existingMedia[0]?.publicUrl || undefined,
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
        }

        // Create media and update post
        return await tx.post.update({
          where: { id: postId },
          data: {
            status: PostStatus.PUBLISHED,
            processingStatus: ProcessingStatus.COMPLETED,
            mediaUrl: mediaItems.length > 0 ? mediaItems[0].publicUrl : undefined,
            media: {
              create: mediaItems,
            },
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
      });

      this.logger.log(`[Job ${job.id}] Post published successfully with ${mediaItems.length} media items`);

      // Format post data for broadcast
      const profile = publishedPost.user.profile;
      const displayName = profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : 'Unknown';

      const formattedPost = {
        id: publishedPost.id,
        content: publishedPost.content,
        status: publishedPost.status,
        processingStatus: publishedPost.processingStatus,
        processingError: publishedPost.processingError,
        mediaUrl: publishedPost.mediaUrl,
        mediaItems: (publishedPost.media || []).map((m) => ({
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
        likes: publishedPost._count.likes,
        comments: publishedPost.commentsCount,
        isLiked: false,
        isBookmarked: false,
        isOwner: true,
        author: {
          id: publishedPost.user.id,
          displayName,
          username: profile?.username || 'unknown',
          avatarUrl: profile?.fotoProfilUrl ?? undefined,
          isVerified: Boolean(publishedPost.user.emailVerifiedAt),
        },
        createdAt: publishedPost.createdAt.toISOString(),
        updatedAt: publishedPost.updatedAt?.toISOString() ?? publishedPost.createdAt.toISOString(),
      };

      // Broadcast new post event via SSE
      this.feedEventsService.broadcastNewPost(publishedPost.id, userId, formattedPost);

      // Update upload history to completed
      if (historyId) {
        await this.uploadHistoryService.updateHistory(historyId, {
          status: 'COMPLETED' as any,
          postId: publishedPost.id,
        });
        this.logger.log(`[Job ${job.id}] Updated upload history to COMPLETED: ${historyId}`);
      }

      return {
        success: true,
        postId,
        mediaCount: mediaItems.length,
      };
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Failed to process media upload: ${error.message}`);
      this.logger.error(`[Job ${job.id}] Stack: ${error.stack}`);

      // Update upload history to failed
      if (historyId) {
        await this.uploadHistoryService.updateHistory(historyId, {
          status: 'FAILED' as any,
          errorMessage: error.message,
        });
        this.logger.log(`[Job ${job.id}] Updated upload history to FAILED: ${historyId}`);
      }

      // Update post status to FAILED
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.FAILED,
          processingStatus: ProcessingStatus.FAILED,
          processingError: error.message,
        },
      });

      throw error; // Re-throw to trigger Bull retry mechanism
    }
  }
}
