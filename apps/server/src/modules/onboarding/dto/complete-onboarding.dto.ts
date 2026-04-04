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

export class CompleteOnboardingDto {
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Length(1, 100)
  lastName!: string;

  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsString()
  @Matches(USERNAME_REGEX, {
    message:
      'username must be 3-30 characters and only contain letters, numbers, dots, or underscores.',
  })
  username!: string;

  @IsDateString()
  tanggalLahir!: string;

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Length(1, 120)
  tempatLahir!: string;

  @IsEnum(Gender)
  gender!: Gender;

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
}
