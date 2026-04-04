import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
}));
