type EnvironmentVariables = Record<string, string | undefined>;

function requireEnv(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Environment variable ${key} is required.`);
  }

  return value;
}

function parsePositiveInteger(key: string, value: string | undefined, fallback?: number): number {
  const raw = value ?? fallback?.toString();
  const parsed = Number(raw);

  if (!raw || Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive number.`);
  }

  return parsed;
}

export function validateEnv(config: EnvironmentVariables): EnvironmentVariables {
  requireEnv('DATABASE_URL', config.DATABASE_URL);
  requireEnv('JWT_ACCESS_SECRET', config.JWT_ACCESS_SECRET);
  requireEnv('OTP_HASH_SECRET', config.OTP_HASH_SECRET);
  requireEnv('RESEND_API_KEY', config.RESEND_API_KEY);
  requireEnv('MAIL_FROM', config.MAIL_FROM);
  requireEnv('CLIENT_APP_URL', config.CLIENT_APP_URL);
  requireEnv('CORS_ORIGINS', config.CORS_ORIGINS);

  parsePositiveInteger('PORT', config.PORT, 3000);
  parsePositiveInteger('PASSWORD_SALT_ROUNDS', config.PASSWORD_SALT_ROUNDS, 12);
  parsePositiveInteger('OTP_EXPIRES_MINUTES', config.OTP_EXPIRES_MINUTES, 10);
  parsePositiveInteger('OTP_LENGTH', config.OTP_LENGTH, 6);
  parsePositiveInteger('OTP_MAX_VERIFY_ATTEMPTS', config.OTP_MAX_VERIFY_ATTEMPTS, 5);
  parsePositiveInteger('OTP_RESEND_COOLDOWN_SECONDS', config.OTP_RESEND_COOLDOWN_SECONDS, 60);
  parsePositiveInteger('OTP_MAX_RESENDS', config.OTP_MAX_RESENDS, 5);
  parsePositiveInteger('UPLOAD_MAX_FILE_SIZE', config.UPLOAD_MAX_FILE_SIZE, 2 * 1024 * 1024);

  if ((config.UPLOAD_DRIVER ?? 'local') === 'do-spaces') {
    requireEnv('DO_SPACES_REGION', config.DO_SPACES_REGION);
    requireEnv('DO_SPACES_BUCKET', config.DO_SPACES_BUCKET);
    requireEnv('DO_SPACES_ENDPOINT', config.DO_SPACES_ENDPOINT);
    requireEnv('DO_SPACES_CDN_URL', config.DO_SPACES_CDN_URL);
    requireEnv('DO_SPACES_KEY', config.DO_SPACES_KEY);
    requireEnv('DO_SPACES_SECRET', config.DO_SPACES_SECRET);
  }

  return config;
}
