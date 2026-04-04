import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class RequestUploadDto {
  @IsString()
  @MaxLength(255)
  filename: string;

  @IsString()
  @MaxLength(100)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  size: number;

  @IsEnum(['image', 'video'])
  mediaType: 'image' | 'video';
}
