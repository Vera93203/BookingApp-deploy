import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK = 'dev-only-jwt-secret-not-for-production';

export function resolveJwtSecret(configService: ConfigService): string {
  const explicit = configService.get<string>('JWT_SECRET');
  if (explicit) {
    return explicit;
  }
  if (configService.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return DEV_FALLBACK;
}
