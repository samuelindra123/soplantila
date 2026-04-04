import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CompletedUploadPartDto {
  @IsInt()
  partNumber: number;

  @IsString()
  eTag: string;
}

export class ConfirmUploadDto {
  @IsString()
  uploadId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedUploadPartDto)
  completedParts?: CompletedUploadPartDto[];
}
