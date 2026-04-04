import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateDraftPostDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required.' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters.' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  uploadIds?: string[];
}
