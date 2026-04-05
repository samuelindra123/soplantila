import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { ObjectCannedACL } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface DirectUploadResult {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
}

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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Service untuk upload file langsung ke storage tanpa presigned URL.
 * Digunakan untuk instant post upload.
 */
@Injectable()
export class DirectUploadService {
  private readonly s3Client: S3Client | null;
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly acl: ObjectCannedACL;

  constructor(private readonly configService: ConfigService) {
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
   * Upload image file langsung ke storage
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<DirectUploadResult> {
    this.validateImageFile(file);
    return this.uploadToStorage(file, userId, 'posts/images');
  }

  /**
   * Upload video file langsung ke storage
   */
  async uploadVideo(
    file: Express.Multer.File,
    userId: string,
  ): Promise<DirectUploadResult> {
    this.validateVideoFile(file);
    return this.uploadToStorage(file, userId, 'posts/videos');
  }

  /**
   * Upload any supported media file
   */
  async uploadMedia(
    file: Express.Multer.File,
    userId: string,
  ): Promise<DirectUploadResult & { mediaType: 'image' | 'video' }> {
    const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype);
    const isVideo = ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype);

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        `File type not supported. Allowed: ${[...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES].join(', ')}`,
      );
    }

    if (isImage) {
      const result = await this.uploadImage(file, userId);
      return { ...result, mediaType: 'image' };
    }

    const result = await this.uploadVideo(file, userId);
    return { ...result, mediaType: 'video' };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(storageKey: string): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
    } catch {
      // Silent fail - cleanup is best effort
    }
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `Image too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  private validateVideoFile(file: Express.Multer.File): void {
    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid video type. Allowed: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException(
        `Video too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  private async uploadToStorage(
    file: Express.Multer.File,
    userId: string,
    prefix: string,
  ): Promise<DirectUploadResult> {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'Storage service is not configured.',
      );
    }

    const now = new Date();
    const datePrefix = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const extension = extname(file.originalname) || this.getExtensionFromMimeType(file.mimetype);
    const storageKey = `${prefix}/${userId}/${datePrefix}/${randomUUID()}${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: file.buffer,
          ACL: this.acl,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      return {
        storageKey,
        publicUrl: this.buildPublicUrl(storageKey),
        mimeType: file.mimetype,
        fileSize: file.size,
        originalName: file.originalname,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  private buildPublicUrl(storageKey: string): string {
    return `${this.cdnUrl.replace(/\/$/, '')}/${storageKey}`;
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
}
