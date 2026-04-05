import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadHistoryStatus, MediaUploadStatus, MediaType } from '@prisma/client';

export interface CreateUploadHistoryDto {
  userId: string;
  content: string;
  mediaItems?: Array<{
    mediaType: MediaType;
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
  }>;
}

export interface UpdateUploadHistoryDto {
  status?: UploadHistoryStatus;
  postId?: string;
  errorMessage?: string;
  completedMediaCount?: number;
}

export interface UpdateMediaItemDto {
  status?: MediaUploadStatus;
  progress?: number;
  publicUrl?: string;
  errorMessage?: string;
}

@Injectable()
export class UploadHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new upload history entry
   */
  async createHistory(dto: CreateUploadHistoryDto) {
    const history = await this.prisma.uploadHistory.create({
      data: {
        userId: dto.userId,
        content: dto.content,
        status: UploadHistoryStatus.PENDING,
        totalMediaCount: dto.mediaItems?.length || 0,
        completedMediaCount: 0,
        media: dto.mediaItems
          ? {
              create: dto.mediaItems.map((item, index) => ({
                mediaType: item.mediaType,
                fileName: item.fileName,
                fileSize: item.fileSize,
                mimeType: item.mimeType,
                thumbnailUrl: item.thumbnailUrl,
                status: MediaUploadStatus.PENDING,
                progress: 0,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    console.log('[UploadHistory] Created:', {
      historyId: history.id,
      userId: dto.userId,
      mediaCount: dto.mediaItems?.length || 0,
    });

    return history;
  }

  /**
   * Update upload history status
   */
  async updateHistory(historyId: string, dto: UpdateUploadHistoryDto) {
    const data: any = {
      ...dto,
      updatedAt: new Date(),
    };

    // Calculate processing time if completed or failed
    if (dto.status === UploadHistoryStatus.COMPLETED || dto.status === UploadHistoryStatus.FAILED) {
      const history = await this.prisma.uploadHistory.findUnique({
        where: { id: historyId },
        select: { startedAt: true },
      });

      if (history) {
        const processingTimeMs = Date.now() - history.startedAt.getTime();
        data.completedAt = new Date();
        data.processingTimeMs = processingTimeMs;
      }
    }

    const updated = await this.prisma.uploadHistory.update({
      where: { id: historyId },
      data,
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    console.log('[UploadHistory] Updated:', {
      historyId,
      status: dto.status,
      processingTimeMs: data.processingTimeMs,
    });

    return updated;
  }

  /**
   * Update media item in history
   */
  async updateMediaItem(mediaItemId: string, dto: UpdateMediaItemDto) {
    const data: any = {
      ...dto,
      updatedAt: new Date(),
    };

    // Calculate upload time if completed or failed
    if (dto.status === MediaUploadStatus.COMPLETED || dto.status === MediaUploadStatus.FAILED) {
      const mediaItem = await this.prisma.uploadHistoryMedia.findUnique({
        where: { id: mediaItemId },
        select: { startedAt: true },
      });

      if (mediaItem) {
        const uploadTimeMs = Date.now() - mediaItem.startedAt.getTime();
        data.completedAt = new Date();
        data.uploadTimeMs = uploadTimeMs;
      }
    }

    const updated = await this.prisma.uploadHistoryMedia.update({
      where: { id: mediaItemId },
      data,
    });

    console.log('[UploadHistory] Media updated:', {
      mediaItemId,
      status: dto.status,
      progress: dto.progress,
      uploadTimeMs: data.uploadTimeMs,
    });

    return updated;
  }

  /**
   * Get user's upload history with pagination
   */
  async getUserHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.uploadHistory.findMany({
        where: { userId },
        include: {
          media: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.uploadHistory.count({
        where: { userId },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    };
  }

  /**
   * Get single history entry
   */
  async getHistory(historyId: string) {
    return this.prisma.uploadHistory.findUnique({
      where: { id: historyId },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Delete history entry
   */
  async deleteHistory(historyId: string, userId: string) {
    // Verify ownership
    const history = await this.prisma.uploadHistory.findFirst({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new Error('History not found or unauthorized');
    }

    await this.prisma.uploadHistory.delete({
      where: { id: historyId },
    });

    console.log('[UploadHistory] Deleted:', { historyId, userId });
  }

  /**
   * Clear completed history (older than 7 days)
   */
  async clearOldCompleted(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.uploadHistory.deleteMany({
      where: {
        userId,
        status: UploadHistoryStatus.COMPLETED,
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    console.log('[UploadHistory] Cleared old completed:', {
      userId,
      deletedCount: result.count,
    });

    return result.count;
  }
}
