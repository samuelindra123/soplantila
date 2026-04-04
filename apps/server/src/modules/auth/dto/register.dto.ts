import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PASSWORD_REGEX } from '../../../common/constants/security.constants';

@ValidatorConstraint({ name: 'matchPassword', async: false })
class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments): boolean {
    const object = args.object as RegisterDto;
    return confirmPassword === object.password;
  }

  defaultMessage(): string {
    return 'confirmPassword must match password.';
  }
}

export class RegisterDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, {
    message:
      'password must contain uppercase, lowercase, number, and special character.',
  })
  password!: string;

  @IsString()
  @Validate(MatchPasswordConstraint)
  confirmPassword!: string;
}
