import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PostMediaDto {
  @IsEnum(['image', 'video'])
  mediaType: 'image' | 'video';

  @IsString()
  @MaxLength(500)
  storageKey: string;

  @IsUrl()
  @MaxLength(500)
  publicUrl: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  previewImageUrl?: string;

  @IsString()
  @MaxLength(100)
  mimeType: string;

  @IsInt()
  @Min(0)
  fileSize: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required.' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters.' })
  content: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];
}
