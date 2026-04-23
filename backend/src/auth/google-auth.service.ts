import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null;
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    if (!clientId) {
      if (isProd) {
        throw new Error('GOOGLE_CLIENT_ID is required in production');
      }
      this.logger.warn('GOOGLE_CLIENT_ID not set — Google sign-in disabled until configured');
      return;
    }

    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    if (!this.client) {
      throw new UnauthorizedException(
        'Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server.',
      );
    }

    try {
      const raw = this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
      const audiences = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (audiences.length === 0) {
        throw new UnauthorizedException('GOOGLE_CLIENT_ID is not configured');
      }
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: audiences.length === 1 ? audiences[0] : audiences,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        fullName: payload.name || '',
        avatarUrl: payload.picture,
      };
    } catch (error) {
      this.logger.error('Google token verification failed', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
