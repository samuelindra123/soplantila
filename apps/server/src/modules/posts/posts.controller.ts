import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateDraftPostDto } from './dto/create-draft-post.dto';
import { MediaUploadService } from '../upload/media-upload.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaUploadService: MediaUploadService,
    @InjectQueue('media-upload') private readonly mediaUploadQueue: Queue,
  ) {}

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

    // Add job to queue for background processing
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

    console.log('[PostsController] Draft post queued:', {
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
