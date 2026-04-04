import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { MediaUploadService } from './media-upload.service';
import { MediaUploadController } from './media-upload.controller';

@Module({
  controllers: [MediaUploadController],
  providers: [UploadService, MediaUploadService],
  exports: [UploadService, MediaUploadService],
})
export class UploadModule {}
