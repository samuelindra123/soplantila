import { registerAs } from '@nestjs/config';

export const uploadConfig = registerAs('upload', () => ({
  driver: process.env.UPLOAD_DRIVER ?? 'local',
  maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 2 * 1024 * 1024),
  localDir: process.env.UPLOAD_LOCAL_DIR ?? 'uploads/profile-images',
  publicBaseUrl: process.env.UPLOAD_PUBLIC_BASE_URL ?? '',
  doSpaces: {
    region: process.env.DO_SPACES_REGION ?? '',
    bucket: process.env.DO_SPACES_BUCKET ?? '',
    endpoint: process.env.DO_SPACES_ENDPOINT ?? '',
    bucketEndpoint: process.env.DO_SPACES_BUCKET_ENDPOINT ?? '',
    cdnUrl: process.env.DO_SPACES_CDN_URL ?? '',
    key: process.env.DO_SPACES_KEY ?? '',
    secret: process.env.DO_SPACES_SECRET ?? '',
    profileImagePrefix: process.env.DO_SPACES_PROFILE_IMAGE_PREFIX ?? 'profile-images',
    coverImagePrefix: process.env.DO_SPACES_COVER_IMAGE_PREFIX ?? 'cover-images',
    acl: process.env.DO_SPACES_ACL ?? 'public-read',
  },
}));
