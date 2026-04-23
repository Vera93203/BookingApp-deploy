import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { EmailService } from '../email/email.service';
import { PropertiesService } from '../properties/properties.service';
import { RoomsService } from '../rooms/rooms.service';
import { CreatePropertyDto, UpdatePropertyDto } from '../properties/dto/property.dto';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../rooms/dto/room.dto';
import { PartnerStatus } from '@prisma/client';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
    private emailService: EmailService,
    private propertiesService: PropertiesService,
    private roomsService: RoomsService,
  ) {}

  async getPartnerByUserId(userId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      include: { properties: { include: { roomTypes: true } } },
    });
    if (!partner) throw new NotFoundException('Partner profile not found');
    return partner;
  }

  async registerPartner(userId: string, data: {
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    address?: string;
    licenseNumber?: string;
  }) {
    const existing = await this.prisma.partner.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Already registered as partner');

    const partner = await this.prisma.$transaction([
      this.prisma.partner.create({
        data: {
          userId,
          ...data,
          status: PartnerStatus.PENDING_APPROVAL,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'PARTNER' },
      }),
    ]);

    return partner[0];
  }

  // Property management
  async createProperty(userId: string, dto: CreatePropertyDto) {
    const partner = await this.getPartnerByUserId(userId);
    if (partner.status !== PartnerStatus.APPROVED) {
      throw new ForbiddenException('Partner not approved yet');
    }
    return this.propertiesService.create(partner.id, dto);
  }

  async updateProperty(userId: string, propertyId: string, dto: UpdatePropertyDto) {
    const partner = await this.getPartnerByUserId(userId);
    return this.propertiesService.update(propertyId, partner.id, dto);
  }

  async getMyProperties(userId: string) {
    const partner = await this.getPartnerByUserId(userId);
    return this.propertiesService.getPartnerProperties(partner.id);
  }

  async getMyProperty(userId: string, propertyId: string) {
    const partner = await this.getPartnerByUserId(userId);
    return this.propertiesService.findForPartner(propertyId, partner.id);
  }

  // Room management
  async createRoom(userId: string, propertyId: string, dto: CreateRoomTypeDto) {
    const partner = await this.getPartnerByUserId(userId);
    return this.roomsService.create(propertyId, partner.id, dto);
  }

  async updateRoom(userId: string, roomId: string, dto: UpdateRoomTypeDto) {
    const partner = await this.getPartnerByUserId(userId);
    return this.roomsService.update(roomId, partner.id, dto);
  }

  async deleteRoom(userId: string, roomId: string) {
    const partner = await this.getPartnerByUserId(userId);
    return this.roomsService.delete(roomId, partner.id);
  }

  // Booking management
  async getBookings(userId: string) {
    const partner = await this.getPartnerByUserId(userId);
    return this.bookingsService.getPartnerBookings(partner.id);
  }

  async approveBooking(userId: string, bookingId: string) {
    const partner = await this.getPartnerByUserId(userId);
    const booking = await this.bookingsService.approveBooking(bookingId, partner.id);

    // Send confirmation email
    if (booking.user?.email || (booking as any).guestEmail) {
      const roomNames = booking.bookingItems
        .map((item: any) => item.roomType?.name || 'Room')
        .join(', ');

      await this.emailService.sendBookingConfirmation({
        bookingId: booking.id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail || booking.user?.email || '',
        hotelName: booking.property.name,
        roomName: roomNames,
        checkIn: new Date(booking.checkIn).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        checkOut: new Date(booking.checkOut).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        nights: Math.ceil(
          (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime())
          / (1000 * 60 * 60 * 24),
        ),
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        address: booking.property.address,
      });
    }

    this.logger.log(`Booking ${bookingId} approved by partner ${partner.id}`);
    return booking;
  }

  async rejectBooking(userId: string, bookingId: string, reason?: string) {
    const partner = await this.getPartnerByUserId(userId);
    const booking = await this.bookingsService.rejectBooking(bookingId, partner.id, reason);

    // Send rejection email
    const fullBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true, bookingItems: { include: { roomType: true } }, user: true },
    });

    if (fullBooking && (fullBooking.guestEmail || fullBooking.user?.email)) {
      await this.emailService.sendBookingRejection({
        bookingId: fullBooking.id,
        guestName: fullBooking.guestName,
        guestEmail: fullBooking.guestEmail || fullBooking.user?.email || '',
        hotelName: fullBooking.property.name,
        roomName: fullBooking.bookingItems.map((i) => i.roomType.name).join(', '),
        checkIn: fullBooking.checkIn.toISOString(),
        checkOut: fullBooking.checkOut.toISOString(),
        nights: 0,
        totalAmount: fullBooking.totalAmount,
        currency: fullBooking.currency,
        address: fullBooking.property.address,
        reason,
      });
    }

    this.logger.log(`Booking ${bookingId} rejected by partner ${partner.id}`);
    return booking;
  }
}
