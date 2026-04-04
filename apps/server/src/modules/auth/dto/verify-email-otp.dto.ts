import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailOtpDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/, { message: 'otpCode must be a 6 digit numeric code.' })
  otpCode!: string;
}
