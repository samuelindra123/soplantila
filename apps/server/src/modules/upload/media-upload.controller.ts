import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { MediaUploadService } from './media-upload.service';
import { RequestUploadDto } from './dto/request-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class MediaUploadController {
  constructor(private readonly mediaUploadService: MediaUploadService) {}

  @Post('request')
  async requestUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestUploadDto,
  ) {
    const result = await this.mediaUploadService.requestUpload(user.sub, {
      filename: dto.filename,
      mimeType: dto.mimeType,
      size: dto.size,
      mediaType: dto.mediaType,
    });

    return {
      uploadId: result.uploadId,
      uploadStrategy: result.uploadStrategy,
      presignedUrl: result.presignedUrl,
      partSize: result.partSize,
      partUrls: result.partUrls,
      tempKey: result.tempKey,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Post('confirm')
  async confirmUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmUploadDto,
  ) {
    const result = await this.mediaUploadService.confirmUpload(user.sub, {
      uploadId: dto.uploadId,
      completedParts: dto.completedParts,
    });

    return {
      mediaType: result.mediaType.toLowerCase(),
      storageKey: result.storageKey,
      publicUrl: result.publicUrl,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      originalName: result.originalName,
    };
  }
}
