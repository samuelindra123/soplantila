import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO untuk instant post dengan file upload.
 * File diupload langsung via multipart/form-data.
 */
export class CreateInstantPostDto {
  @IsString()
  @MaxLength(5000, { message: 'Content must not exceed 5000 characters.' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Title must not exceed 120 characters.' })
  title?: string;
}
