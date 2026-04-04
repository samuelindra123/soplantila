import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
