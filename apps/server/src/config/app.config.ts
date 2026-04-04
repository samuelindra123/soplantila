import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'Soplantila API',
  url: process.env.APP_URL ?? 'http://localhost:3000',
  clientAppUrl: process.env.CLIENT_APP_URL ?? 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  authExposeOtpInResponse: process.env.AUTH_EXPOSE_OTP_IN_RESPONSE === 'true',
}));
