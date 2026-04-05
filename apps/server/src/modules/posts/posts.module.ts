import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PostsController, FeedController, UserPostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UploadModule } from '../upload/upload.module';
import { MediaUploadProcessor } from './processors/media-upload.processor';
import { UploadHistoryService } from './upload-history.service';
import { UploadHistoryController } from './upload-history.controller';
import { FeedEventsService } from './feed-events.service';
import { FeedEventsController } from './feed-events.controller';

@Module({
  imports: [
    UploadModule,
    BullModule.registerQueue({
      name: 'media-upload',
    }),
  ],
  controllers: [
    PostsController,
    FeedController,
    UserPostsController,
    UploadHistoryController,
    FeedEventsController,
  ],
  providers: [
    PostsService,
    MediaUploadProcessor,
    UploadHistoryService,
    FeedEventsService,
  ],
  exports: [PostsService, UploadHistoryService, FeedEventsService],
})
export class PostsModule {}
