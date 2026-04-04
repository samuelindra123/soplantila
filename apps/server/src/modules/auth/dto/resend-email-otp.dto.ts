import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendEmailOtpDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;
}
