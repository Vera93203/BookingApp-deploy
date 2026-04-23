import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PartnerStatus, PropertyStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalPartners, totalProperties, totalBookings, recentBookings] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.partner.count(),
        this.prisma.property.count({ where: { status: PropertyStatus.APPROVED } }),
        this.prisma.booking.count(),
        this.prisma.booking.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { name: true } },
            user: { select: { phone: true, email: true } },
          },
        }),
      ]);

    return { totalUsers, totalPartners, totalProperties, totalBookings, recentBookings };
  }

  async getPendingPartners() {
    return this.prisma.partner.findMany({
      where: { status: PartnerStatus.PENDING_APPROVAL },
      include: {
        user: { select: { phone: true, email: true, profile: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePartner(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    return this.prisma.partner.update({
      where: { id: partnerId },
      data: { status: PartnerStatus.APPROVED, approvedAt: new Date() },
    });
  }

  async rejectPartner(partnerId: string) {
    return this.prisma.partner.update({
      where: { id: partnerId },
      data: { status: PartnerStatus.REJECTED },
    });
  }

  async getPendingProperties() {
    return this.prisma.property.findMany({
      where: { status: PropertyStatus.PENDING_APPROVAL },
      include: { partner: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveProperty(propertyId: string) {
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: PropertyStatus.APPROVED },
    });
  }

  async rejectProperty(propertyId: string) {
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: PropertyStatus.REJECTED },
    });
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAllBookings(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        skip,
        take: limit,
        include: {
          property: { select: { name: true } },
          payment: true,
          user: { select: { phone: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count(),
    ]);
    return { bookings, total, page, totalPages: Math.ceil(total / limit) };
  }
}
