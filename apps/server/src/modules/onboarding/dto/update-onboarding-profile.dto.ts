import { Gender } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { USERNAME_REGEX } from '../../../common/constants/security.constants';

export enum CoverImageAction {
  KEEP = 'KEEP',
  REPLACE = 'REPLACE',
  REMOVE = 'REMOVE',
}

export class UpdateOnboardingProfileDto {
  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @Transform(({ value }) =>
    value == null || value === '' ? undefined : String(value).trim().toLowerCase(),
  )
  @IsOptional()
  @IsString()
  @Matches(USERNAME_REGEX, {
    message:
      'username must be 3-30 characters and only contain letters, numbers, dots, or underscores.',
  })
  username?: string;

  @IsOptional()
  @IsDateString()
  tanggalLahir?: string;

  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @Length(1, 120)
  tempatLahir?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Transform(({ value }) => (value == null || value === '' ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pekerjaan?: string;

  @Transform(({ value }) => (value == null || value === '' ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Transform(({ value }) => (value == null || value === '' ? CoverImageAction.KEEP : value))
  @IsOptional()
  @IsEnum(CoverImageAction)
  coverImageAction?: CoverImageAction;
}
