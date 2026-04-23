import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateProfileDto, CompleteProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, phone: true, email: true, role: true } } },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check username uniqueness
    if (dto.username) {
      const existing = await this.prisma.userProfile.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.userId !== userId) {
        throw new ConflictException('Username already taken');
      }
    }

    // Update email on user record if provided
    if (dto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (existingEmail) throw new ConflictException('Email already in use');

      await this.prisma.user.update({
        where: { id: userId },
        data: { email: dto.email },
      });
    }

    if (dto.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        username: dto.username,
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationality: dto.nationality,
        isComplete: true,
      },
      create: {
        userId,
        username: dto.username,
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationality: dto.nationality,
        isComplete: true,
      },
    });

    return profile;
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.userProfile.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.userId !== userId) {
        throw new ConflictException('Username already taken');
      }
    }

    if (dto.email) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: dto.email },
      });
    }

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        username: dto.username,
        fullName: dto.fullName,
        isComplete: true,
      },
      create: {
        userId,
        username: dto.username,
        fullName: dto.fullName,
        isComplete: true,
      },
    });

    return profile;
  }
}
