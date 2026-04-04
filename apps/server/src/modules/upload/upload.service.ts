import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ObjectCannedACL } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { ALLOWED_PROFILE_IMAGE_MIME_TYPES } from '../../common/constants/security.constants';

@Injectable()
export class UploadService {
  private readonly driver: string;
  private readonly maxFileSize: number;
  private readonly localDir: string;
  private readonly publicBaseUrl: string;
  private readonly doSpacesBucket: string;
  private readonly doSpacesCdnUrl: string;
  private readonly doSpacesProfileImagePrefix: string;
  private readonly doSpacesCoverImagePrefix: string;
  private readonly doSpacesAcl: ObjectCannedACL;
  private readonly s3Client: S3Client | null;

  constructor(private readonly configService: ConfigService) {
    this.driver = this.configService.get<string>('upload.driver', 'local');
    this.maxFileSize = this.configService.get<number>('upload.maxFileSize', 2 * 1024 * 1024);
    this.localDir = this.configService.get<string>('upload.localDir', 'uploads/profile-images');
    this.publicBaseUrl = this.configService.get<string>('upload.publicBaseUrl', '');
    this.doSpacesBucket = this.configService.get<string>('upload.doSpaces.bucket', '');
    this.doSpacesCdnUrl = this.configService.get<string>('upload.doSpaces.cdnUrl', '');
    this.doSpacesProfileImagePrefix = this.configService.get<string>(
      'upload.doSpaces.profileImagePrefix',
      'profile-images',
    );
    this.doSpacesCoverImagePrefix = this.configService.get<string>(
      'upload.doSpaces.coverImagePrefix',
      'cover-images',
    );
    this.doSpacesAcl = this.configService.get<string>(
      'upload.doSpaces.acl',
      'public-read',
    ) as ObjectCannedACL;
    this.s3Client =
      this.driver === 'do-spaces'
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

  async uploadProfileImage(
    file?: Express.Multer.File,
    userId?: string,
  ): Promise<string | null> {
    return this.uploadImageByType(file, userId, 'profile');
  }

  async uploadCoverImage(
    file?: Express.Multer.File,
    userId?: string,
  ): Promise<string | null> {
    return this.uploadImageByType(file, userId, 'cover');
  }

  private async uploadImageByType(
    file: Express.Multer.File | undefined,
    userId: string | undefined,
    imageType: 'profile' | 'cover',
  ): Promise<string | null> {
    if (!file) {
      return null;
    }

    if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Profile image must be a JPG, PNG, or WEBP file.',
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Profile image exceeds the maximum file size.');
    }

    if (this.driver === 'do-spaces') {
      return this.uploadToDoSpaces(file, userId, imageType);
    }

    try {
      await mkdir(this.localDir, { recursive: true });
      const extension = extname(file.originalname) || '.jpg';
      const filename = `${randomUUID()}${extension}`;
      const absolutePath = join(this.localDir, filename);

      await writeFile(absolutePath, file.buffer);

      return `/${this.localDir}/${filename}`.replace(/\/{2,}/g, '/');
    } catch {
      throw new InternalServerErrorException('Failed to store profile image.');
    }
  }

  async deleteProfileImage(fileUrl?: string | null): Promise<void> {
    if (!fileUrl) {
      return;
    }

    if (this.driver === 'do-spaces') {
      await this.deleteFromDoSpaces(fileUrl);
      return;
    }

    await this.deleteFromLocalStorage(fileUrl);
  }

  private async uploadToDoSpaces(
    file: Express.Multer.File,
    userId?: string,
    imageType: 'profile' | 'cover' = 'profile',
  ): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('DigitalOcean Spaces client is not configured.');
    }

    const extension = extname(file.originalname) || this.getExtensionFromMimeType(file.mimetype);
    const now = new Date();
    const datePrefix = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const imagePrefix =
      imageType === 'cover'
        ? this.doSpacesCoverImagePrefix
        : this.doSpacesProfileImagePrefix;
    const objectKey = [
      imagePrefix,
      userId ?? 'anonymous',
      datePrefix,
      `${randomUUID()}${extension}`,
    ].join('/');

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.doSpacesBucket,
          Key: objectKey,
          Body: file.buffer,
          ACL: this.doSpacesAcl,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
          ContentDisposition: 'inline',
        }),
      );

      return this.buildPublicUrl(objectKey);
    } catch {
      throw new InternalServerErrorException(
        'Failed to upload profile image to DigitalOcean Spaces.',
      );
    }
  }

  private buildPublicUrl(objectKey: string): string {
    const baseUrl =
      this.doSpacesCdnUrl ||
      this.publicBaseUrl ||
      this.configService.get<string>('upload.doSpaces.bucketEndpoint', '');

    return `${baseUrl.replace(/\/$/, '')}/${objectKey}`;
  }

  private async deleteFromDoSpaces(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    const objectKey = this.extractSpacesObjectKey(fileUrl);

    if (!objectKey) {
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.doSpacesBucket,
          Key: objectKey,
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to delete old profile image from DigitalOcean Spaces.',
      );
    }
  }

  private async deleteFromLocalStorage(fileUrl: string): Promise<void> {
    const normalizedPrefix = `/${this.localDir}/`;

    if (!fileUrl.startsWith(normalizedPrefix)) {
      return;
    }

    const relativePath = fileUrl.replace(/^\//, '');

    try {
      await rm(relativePath, { force: true });
    } catch {
      throw new InternalServerErrorException('Failed to delete old profile image.');
    }
  }

  private extractSpacesObjectKey(fileUrl: string): string | null {
    const candidateBaseUrls = [
      this.doSpacesCdnUrl,
      this.publicBaseUrl,
      this.configService.get<string>('upload.doSpaces.bucketEndpoint', ''),
      `${this.configService.get<string>('upload.doSpaces.endpoint', '').replace(/\/$/, '')}/${this.doSpacesBucket}`,
    ].filter(Boolean);

    for (const baseUrl of candidateBaseUrls) {
      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

      if (fileUrl.startsWith(`${normalizedBaseUrl}/`)) {
        return fileUrl.slice(normalizedBaseUrl.length + 1);
      }
    }

    return null;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return '.jpg';
    }
  }
}
