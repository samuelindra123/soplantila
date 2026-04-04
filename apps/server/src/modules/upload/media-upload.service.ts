import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ObjectCannedACL } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { MediaType, UploadStrategy } from '@prisma/client';

export type MediaUploadType = 'image' | 'video';

export interface UploadRequestInput {
  filename: string;
  mimeType: string;
  size: number;
  mediaType: MediaUploadType;
}

export interface UploadRequestResult {
  uploadId: string;
  uploadStrategy: 'single' | 'multipart';
  presignedUrl: string;
  partUrls?: Array<{
    partNumber: number;
    presignedUrl: string;
  }>;
  partSize?: number;
  tempKey: string;
  expiresAt: Date;
}

export interface ConfirmUploadInput {
  uploadId: string;
  completedParts?: Array<{
    partNumber: number;
    eTag: string;
  }>;
}

export interface ConfirmUploadResult {
  mediaType: MediaType;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  originalName: string | null;
}

// Allowed MIME types for posts
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

// Max sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MULTIPART_VIDEO_THRESHOLD = 12 * 1024 * 1024; // 12MB
const MULTIPART_PART_SIZE = 6 * 1024 * 1024; // 6MB

@Injectable()
export class MediaUploadService {
  private readonly s3Client: S3Client | null;
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly tempPrefix = 'temp';
  private readonly postsImagePrefix = 'posts/images';
  private readonly postsVideoPrefix = 'posts/videos';
  private readonly acl: ObjectCannedACL;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const driver = this.configService.get<string>('upload.driver', 'local');
    this.bucket = this.configService.get<string>('upload.doSpaces.bucket', '');
    this.cdnUrl = this.configService.get<string>('upload.doSpaces.cdnUrl', '');
    this.acl = this.configService.get<string>(
      'upload.doSpaces.acl',
      'public-read',
    ) as ObjectCannedACL;

    this.s3Client =
      driver === 'do-spaces'
        ? new S3Client({
            region: this.configService.getOrThrow<string>('upload.doSpaces.region'),
            endpoint: this.configService.getOrThrow<string>('upload.doSpaces.endpoint'),
            credentials: {
              accessKeyId: this.configService.getOrThrow<string>('upload.doSpaces.key'),
              secretAccessKey: this.configService.getOrThrow<string>('upload.doSpaces.secret'),
            },
          })
        : null;
  }

  /**
   * Request a pre-signed URL for direct upload to DO Spaces temp folder
   */
  async requestUpload(
    userId: string,
    input: UploadRequestInput,
  ): Promise<UploadRequestResult> {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'Storage service is not configured for direct uploads.',
      );
    }

    // Validate media type and mime
    this.validateUploadRequest(input);

    // Generate temp key
    const extension = extname(input.filename) || this.getExtensionFromMimeType(input.mimeType);
    const uuid = randomUUID();
    const tempKey = `${this.tempPrefix}/${userId}/${uuid}${extension}`;

    // Set expiry (1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const shouldUseMultipart =
      input.mediaType === 'video' && input.size >= MULTIPART_VIDEO_THRESHOLD;

    let multipartUploadId: string | undefined;
    let partUrls: UploadRequestResult['partUrls'];
    let uploadStrategy: UploadRequestResult['uploadStrategy'] = shouldUseMultipart
      ? 'multipart'
      : 'single';

    if (shouldUseMultipart) {
      const multipart = await this.createMultipartUpload(tempKey, input.mimeType);
      multipartUploadId = multipart.uploadId;
      partUrls = await this.generateMultipartPartUrls(
        tempKey,
        multipart.uploadId,
        input.size,
      );
    }

    // Create temp upload record
    const tempUpload = await this.prisma.tempUpload.create({
      data: {
        userId,
        tempKey,
        mediaType: input.mediaType === 'image' ? MediaType.IMAGE : MediaType.VIDEO,
        uploadStrategy: shouldUseMultipart ? UploadStrategy.MULTIPART : UploadStrategy.SINGLE,
        multipartUploadId,
        mimeType: input.mimeType,
        fileSize: input.size,
        originalName: input.filename,
        expiresAt,
      },
    });

    const presignedUrl = shouldUseMultipart
      ? ''
      : await this.generatePresignedPutUrl(
          tempKey,
          input.mimeType,
          input.size,
        );

    return {
      uploadId: tempUpload.id,
      uploadStrategy,
      presignedUrl,
      partUrls,
      partSize: shouldUseMultipart ? MULTIPART_PART_SIZE : undefined,
      tempKey,
      expiresAt,
    };
  }

  /**
   * Confirm upload: move from temp to permanent location
   */
  async confirmUpload(
    userId: string,
    input: ConfirmUploadInput,
  ): Promise<ConfirmUploadResult> {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'Storage service is not configured.',
      );
    }

    // Find temp upload record
    const tempUpload = await this.prisma.tempUpload.findUnique({
      where: { id: input.uploadId },
    });

    if (!tempUpload) {
      throw new NotFoundException('Upload not found.');
    }

    if (tempUpload.userId !== userId) {
      throw new UnauthorizedException('You do not own this upload.');
    }

    if (tempUpload.confirmedAt) {
      throw new BadRequestException('Upload already confirmed.');
    }

    if (tempUpload.expiresAt < new Date()) {
      throw new BadRequestException('Upload has expired. Please try again.');
    }

    if (
      tempUpload.uploadStrategy === UploadStrategy.MULTIPART &&
      tempUpload.multipartUploadId
    ) {
      if (!input.completedParts || input.completedParts.length === 0) {
        throw new BadRequestException('Multipart upload parts are required.');
      }

      try {
        await this.completeMultipartUpload(
          tempUpload.tempKey,
          tempUpload.multipartUploadId,
          input.completedParts,
        );
      } catch (error) {
        await this.abortMultipartUpload(tempUpload.tempKey, tempUpload.multipartUploadId);
        throw error;
      }
    }

    // Generate permanent key
    const now = new Date();
    const datePrefix = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const prefix =
      tempUpload.mediaType === MediaType.IMAGE
        ? this.postsImagePrefix
        : this.postsVideoPrefix;
    const extension = extname(tempUpload.tempKey);
    const permanentKey = `${prefix}/${userId}/${datePrefix}/${randomUUID()}${extension}`;

    // Copy from temp to permanent location
    await this.copyObject(tempUpload.tempKey, permanentKey);

    // Delete temp file
    await this.deleteObject(tempUpload.tempKey);

    // Mark as confirmed
    await this.prisma.tempUpload.update({
      where: { id: tempUpload.id },
      data: { confirmedAt: new Date() },
    });

    return {
      mediaType: tempUpload.mediaType,
      storageKey: permanentKey,
      publicUrl: this.buildPublicUrl(permanentKey),
      mimeType: tempUpload.mimeType,
      fileSize: tempUpload.fileSize,
      originalName: tempUpload.originalName,
    };
  }

  /**
   * Delete media from storage
   */
  async deleteMedia(storageKey: string): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    await this.deleteObject(storageKey);
  }

  private validateUploadRequest(input: UploadRequestInput): void {
    if (input.mediaType === 'image') {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(input.mimeType)) {
        throw new BadRequestException(
          `Invalid image type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
        );
      }
      if (input.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException(
          `Image too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        );
      }
    } else if (input.mediaType === 'video') {
      if (!ALLOWED_VIDEO_MIME_TYPES.includes(input.mimeType)) {
        throw new BadRequestException(
          `Invalid video type. Allowed: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`,
        );
      }
      if (input.size > MAX_VIDEO_SIZE) {
        throw new BadRequestException(
          `Video too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
        );
      }
    } else {
      throw new BadRequestException('Invalid media type. Must be "image" or "video".');
    }
  }

  private async generatePresignedPutUrl(
    key: string,
    contentType: string,
    contentLength: number,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('S3 client not configured.');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
      ACL: this.acl,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    // Pre-signed URL valid for 1 hour
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  private async createMultipartUpload(
    key: string,
    contentType: string,
  ): Promise<{ uploadId: string }> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('S3 client not configured.');
    }

    const result = await this.s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ACL: this.acl,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    if (!result.UploadId) {
      throw new InternalServerErrorException('Failed to initialize multipart upload.');
    }

    return { uploadId: result.UploadId };
  }

  private async generateMultipartPartUrls(
    key: string,
    multipartUploadId: string,
    fileSize: number,
  ): Promise<Array<{ partNumber: number; presignedUrl: string }>> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('S3 client not configured.');
    }

    const partCount = Math.max(1, Math.ceil(fileSize / MULTIPART_PART_SIZE));
    const urls: Array<{ partNumber: number; presignedUrl: string }> = [];

    for (let index = 0; index < partCount; index += 1) {
      const partNumber = index + 1;
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipartUploadId,
        PartNumber: partNumber,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });

      urls.push({ partNumber, presignedUrl });
    }

    return urls;
  }

  private async completeMultipartUpload(
    key: string,
    multipartUploadId: string,
    completedParts: Array<{ partNumber: number; eTag: string }>,
  ): Promise<void> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('S3 client not configured.');
    }

    const sortedParts = [...completedParts]
      .sort((left, right) => left.partNumber - right.partNumber)
      .map((part) => ({
        ETag: part.eTag,
        PartNumber: part.partNumber,
      }));

    await this.s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipartUploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      }),
    );
  }

  private async abortMultipartUpload(key: string, multipartUploadId: string): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    try {
      await this.s3Client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: multipartUploadId,
        }),
      );
    } catch {
      // best effort cleanup
    }
  }

  private async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('S3 client not configured.');
    }

    try {
      await this.s3Client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
          ACL: this.acl,
          CacheControl: 'public, max-age=31536000, immutable',
          MetadataDirective: 'COPY',
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to finalize upload. The file may not have been uploaded correctly.',
      );
    }
  }

  private async deleteObject(key: string): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      // Silently fail on delete errors - the temp lifecycle will clean up
    }
  }

  private buildPublicUrl(objectKey: string): string {
    return `${this.cdnUrl.replace(/\/$/, '')}/${objectKey}`;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    };
    return map[mimeType] || '';
  }

  /**
   * Cleanup expired temp uploads (called via cron or manually)
   */
  async cleanupExpiredUploads(): Promise<number> {
    const expired = await this.prisma.tempUpload.findMany({
      where: {
        expiresAt: { lt: new Date() },
        confirmedAt: null,
      },
    });

    for (const upload of expired) {
      try {
        await this.deleteObject(upload.tempKey);
      } catch {
        // Continue cleanup even if delete fails
      }
    }

    const result = await this.prisma.tempUpload.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        confirmedAt: null,
      },
    });

    return result.count;
  }
}
