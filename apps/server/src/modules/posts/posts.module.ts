import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PostsController, FeedController, UserPostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    UploadModule,
    BullModule.registerQueue({
      name: 'media-upload',
    }),
  ],
  controllers: [PostsController, FeedController, UserPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
