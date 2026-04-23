import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { TwilioService } from './twilio.service';
import { GoogleAuthService } from './google-auth.service';
import { SendOtpDto, VerifyOtpDto, GoogleAuthDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private twilioService: TwilioService,
    private googleAuthService: GoogleAuthService,
  ) {}

  // ==========================================
  // PHONE OTP FLOW
  // ==========================================

  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone, dto.country);
    const result = await this.twilioService.sendOtp(phone);
    return { success: result.success, message: 'OTP sent to your phone number' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.normalizePhone(dto.phone, dto.country);
    const result = await this.twilioService.verifyOtp(phone, dto.code);

    if (!result.valid) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          phone,
          countryCode: dto.country.toUpperCase(),
          isVerified: true,
          role: UserRole.USER,
          profile: {
            create: { isComplete: false },
          },
        },
        include: { profile: true },
      });
      this.logger.log(`New user created via OTP: ${user.id}`);
    } else {
      // Mark as verified if not already
      if (!user.isVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            countryCode: user.countryCode ?? dto.country.toUpperCase(),
          },
        });
      } else if (!user.countryCode) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { countryCode: dto.country.toUpperCase() },
        });
      }
      const refreshed = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
      if (refreshed) user = refreshed;
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.email, user.role);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      isNewUser,
      profileComplete: user.profile?.isComplete ?? false,
    };
  }

  // ==========================================
  // GOOGLE SIGN-IN FLOW
  // ==========================================

  async googleAuth(dto: GoogleAuthDto) {
    const googleUser = await this.googleAuthService.verifyIdToken(dto.idToken);
    const requestedCountry = dto.country?.toUpperCase();

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email },
        ],
      },
      include: { profile: true },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.googleId,
          countryCode: requestedCountry,
          isVerified: true,
          role: UserRole.USER,
          profile: {
            create: {
              fullName: googleUser.fullName,
              avatarUrl: googleUser.avatarUrl,
              isComplete: false,
            },
          },
        },
        include: { profile: true },
      });
      this.logger.log(`New user created via Google: ${user.id}`);
    } else {
      // Link Google ID if signing in with existing email
      if (!user.googleId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            isVerified: true,
          },
        });
      }
      // Update avatar if missing
      if (!user.profile?.avatarUrl && googleUser.avatarUrl) {
        await this.prisma.userProfile.update({
          where: { userId: user.id },
          data: { avatarUrl: googleUser.avatarUrl },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.email, user.role);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      isNewUser,
      profileComplete: user.profile?.isComplete ?? false,
    };
  }

  // ==========================================
  // ADMIN EMAIL/PASSWORD LOGIN
  // ==========================================

  async adminLogin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access only');
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.email, user.role);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      isNewUser: false,
      profileComplete: user.profile?.isComplete ?? true,
    };
  }

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, partner: true },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private normalizePhone(phone: string, country: string): string {
    const raw = phone.replace(/[\s\-\(\)]/g, '');
    const region = (country || '').toUpperCase();
    if (!region) {
      throw new BadRequestException('country is required');
    }
    const parsed = raw.startsWith('+')
      ? parsePhoneNumberFromString(raw)
      : parsePhoneNumberFromString(raw, region as any);
    if (!parsed || !parsed.isValid()) {
      throw new BadRequestException('Invalid phone number for selected country');
    }
    return parsed.number;
  }

  private async generateTokens(
    userId: string,
    phone?: string | null,
    email?: string | null,
    role?: string,
  ) {
    const payload = { sub: userId, phone, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
