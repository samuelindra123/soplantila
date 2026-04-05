import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateDraftPostDto } from './dto/create-draft-post.dto';
import { CreateInstantPostDto } from './dto/create-instant-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { MediaUploadService } from '../upload/media-upload.service';
import { DirectUploadService } from '../upload/direct-upload.service';
import { UploadHistoryService } from './upload-history.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaUploadService: MediaUploadService,
    private readonly directUploadService: DirectUploadService,
    private readonly uploadHistoryService: UploadHistoryService,
    @InjectQueue('media-upload') private readonly mediaUploadQueue: Queue,
  ) {}

  /**
   * INSTANT POST ENDPOINT
   * 
   * Terima file upload langsung (multipart/form-data), upload ke storage,
   * dan buat post dengan status PUBLISHED langsung.
   * 
   * User langsung bisa lihat post di feed tanpa menunggu background processing.
   * 
   * Fields:
   * - media: Array file media (image/video)
   * - posters: Array file poster/thumbnail untuk video (in same order as media)
   * - content: Text content
   */
  @Post('instant')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'media', maxCount: 4 },
    { name: 'posters', maxCount: 4 },
  ]))
  async createInstantPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInstantPostDto,
    @UploadedFiles() files?: { media?: Express.Multer.File[]; posters?: Express.Multer.File[] },
  ) {
    const mediaFiles = files?.media || [];
    const posterFiles = files?.posters || [];
    
    console.log('[PostsController] Instant post request:', {
      userId: user.sub,
      contentLength: dto.content?.length || 0,
      filesCount: mediaFiles.length,
      postersCount: posterFiles.length,
    });

    // Upload semua file ke storage langsung
    const uploadedMedia: Array<{
      mediaType: 'image' | 'video';
      storageKey: string;
      publicUrl: string;
      mimeType: string;
      fileSize: number;
      originalName: string;
      previewImageUrl?: string; // Thumbnail/poster URL for videos
    }> = [];
    
    let posterIndex = 0;
    
    if (mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        console.log('[PostsController] Uploading file:', {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        });
        
        const uploaded = await this.directUploadService.uploadMedia(file, user.sub);
        
        const mediaItem: typeof uploadedMedia[0] = {
          mediaType: uploaded.mediaType,
          storageKey: uploaded.storageKey,
          publicUrl: uploaded.publicUrl,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
          originalName: uploaded.originalName,
        };
        
        // Jika ini video dan ada poster file, upload poster
        if (uploaded.mediaType === 'video' && posterFiles[posterIndex]) {
          const posterFile = posterFiles[posterIndex];
          console.log('[PostsController] Uploading video poster:', {
            name: posterFile.originalname,
            size: posterFile.size,
          });
          
          const posterUploaded = await this.directUploadService.uploadImage(
            posterFile,
            user.sub,
          );
          mediaItem.previewImageUrl = posterUploaded.publicUrl;
          posterIndex++;
        }
        
        uploadedMedia.push(mediaItem);
      }
    }

    // Buat post instant (langsung PUBLISHED)
    const post = await this.postsService.createInstantPost(
      user.sub,
      dto.content || '',
      uploadedMedia.length > 0 ? uploadedMedia : undefined,
    );

    console.log('[PostsController] Instant post created:', {
      postId: post.id,
      mediaCount: uploadedMedia.length,
    });

    return {
      message: 'Post created successfully.',
      data: post,
    };
  }

  @Post()
  async createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    const post = await this.postsService.createPost(
      user.sub,
      dto.content,
      dto.media,
    );

    return {
      message: 'Post created successfully.',
      data: post,
    };
  }

  @Post('draft')
  async createDraftPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDraftPostDto,
  ) {
    // Create draft post immediately in database
    const result = await this.postsService.createDraftPost(
      user.sub,
      dto.content,
      dto.uploadIds,
    );

    // Only add to queue if there are uploads to process
    if (result.uploadIds && result.uploadIds.length > 0) {
      await this.mediaUploadQueue.add(
        'process-media-upload',
        {
          postId: result.postId,
          userId: user.sub,
          uploadIds: result.uploadIds,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      console.log('[PostsController] Draft post queued for processing:', {
        postId: result.postId,
        uploadIdsCount: result.uploadIds.length,
      });

      return {
        message: 'Post is being processed.',
        data: {
          postId: result.postId,
          status: result.status,
          processingStatus: result.processingStatus,
        },
      };
    }

    // No media, post already published
    console.log('[PostsController] Post published immediately (no media):', {
      postId: result.postId,
    });

    return {
      message: 'Post created successfully.',
      data: {
        postId: result.postId,
        status: result.status,
        processingStatus: result.processingStatus,
      },
    };
  }

  // DEBUG ENDPOINT: Manually publish stuck DRAFT posts
  @Post('debug/publish-drafts')
  async publishDrafts(@CurrentUser() user: AuthenticatedUser) {
    const draftPosts = await this.postsService.findDraftPosts(user.sub);
    
    const results: Array<{ postId: string; status: string }> = [];
    for (const post of draftPosts) {
      // Add to queue for processing
      await this.mediaUploadQueue.add(
        'process-media-upload',
        {
          postId: post.id,
          userId: user.sub,
          uploadIds: [], // No uploads for old posts
        },
        {
          attempts: 1,
          removeOnComplete: true,
        },
      );
      results.push({ postId: post.id, status: 'queued' });
    }

    return {
      message: `Queued ${results.length} draft posts for processing`,
      data: results,
    };
  }

  @Get(':id')
  async getPost(
    @Param('id') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const post = await this.postsService.getPostById(postId, user.sub);

    return {
      message: 'Post fetched successfully.',
      data: post,
    };
  }

  @Put(':id')
  async updatePost(
    @Param('id') postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ) {
    return await this.postsService.updatePost(postId, user.sub, dto.content);
  }

  @Delete(':id')
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.postsService.deletePost(postId, user.sub);

    // Clean up storage asynchronously
    if (result.storageKeys && result.storageKeys.length > 0) {
      for (const key of result.storageKeys) {
        this.mediaUploadService.deleteMedia(key).catch(() => {
          // Log but don't fail - cleanup is best effort
        });
      }
    }

    return { message: result.message };
  }
}

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getFeed(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.postsService.getFeed(user.sub, page, limit);

    return {
      message: 'Feed fetched successfully.',
      data: result,
    };
  }
}

@Controller('users/:userId/posts')
@UseGuards(JwtAuthGuard)
export class UserPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getUserPosts(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.postsService.getUserPosts(
      userId,
      user.sub,
      page,
      limit,
    );

    return {
      message: 'User posts fetched successfully.',
      data: result,
    };
  }
}
