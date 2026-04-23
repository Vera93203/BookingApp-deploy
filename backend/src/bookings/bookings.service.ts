import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private prisma: PrismaService) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // Validate dates
    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }
    if (checkIn < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) throw new BadRequestException('Minimum 1 night stay');

    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property || property.status !== 'APPROVED') {
      throw new NotFoundException('Property not found or not available');
    }

    // SERVER-SIDE PRICE CALCULATION — never trust frontend
    let totalAmount = 0;
    const bookingItems: Array<{
      roomTypeId: string;
      quantity: number;
      nights: number;
      pricePerNight: number;
      subtotal: number;
    }> = [];

    for (const item of dto.items) {
      const roomType = await this.prisma.roomType.findUnique({
        where: { id: item.roomTypeId },
      });

      if (!roomType || roomType.propertyId !== dto.propertyId || !roomType.isActive) {
        throw new BadRequestException(`Room type ${item.roomTypeId} not available`);
      }

      // Check availability
      const overlappingBookings = await this.prisma.bookingItem.count({
        where: {
          roomTypeId: item.roomTypeId,
          quantity: { gte: 1 },
          booking: {
            status: { in: ['PAID_PENDING_PARTNER_APPROVAL', 'CONFIRMED'] },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        },
      });

      const available = roomType.totalRooms - overlappingBookings;
      if (available < item.quantity) {
        throw new BadRequestException(
          `Only ${available} rooms of type "${roomType.name}" available`,
        );
      }

      const pricePerNight = roomType.basePrice;
      const subtotal = pricePerNight * nights * item.quantity;
      totalAmount += subtotal;

      bookingItems.push({
        roomTypeId: item.roomTypeId,
        quantity: item.quantity,
        nights,
        pricePerNight,
        subtotal,
      });
    }

    // Create booking + items + payment in a transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId,
          propertyId: dto.propertyId,
          checkIn,
          checkOut,
          guestName: dto.guestName,
          guestEmail: dto.guestEmail,
          guestPhone: dto.guestPhone,
          numberOfGuests: dto.numberOfGuests,
          specialRequests: dto.specialRequests,
          totalAmount,
          status: BookingStatus.PENDING_PAYMENT,
          bookingItems: {
            create: bookingItems,
          },
          payment: {
            create: {
              amount: totalAmount,
              method: dto.paymentMethod as PaymentMethod,
              status: PaymentStatus.UNPAID,
            },
          },
        },
        include: {
          bookingItems: { include: { roomType: true } },
          payment: true,
          property: { select: { name: true, address: true, city: true } },
        },
      });

      return newBooking;
    });

    this.logger.log(`Booking created: ${booking.id}, amount: ${totalAmount}`);
    return booking;
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        property: { select: { name: true, city: true, images: true } },
        bookingItems: { include: { roomType: { select: { name: true } } } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        bookingItems: { include: { roomType: true } },
        payment: true,
        user: { select: { id: true, phone: true, email: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Not your booking');
    return booking;
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Not your booking');

    const cancellableStatuses: BookingStatus[] = [
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.PAID_PENDING_PARTNER_APPROVAL,
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled in current status');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: { payment: true },
    });

    // If payment was made, mark for refund
    if (booking.payment?.status === PaymentStatus.PAID) {
      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
      });
    }

    return updated;
  }

  // Partner methods
  async getPartnerBookings(partnerId: string) {
    const properties = await this.prisma.property.findMany({
      where: { partnerId },
      select: { id: true },
    });
    const propertyIds = properties.map((p) => p.id);

    return this.prisma.booking.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        property: { select: { name: true } },
        bookingItems: { include: { roomType: { select: { name: true } } } },
        payment: true,
        user: { select: { phone: true, email: true, profile: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveBooking(bookingId: string, partnerId: string) {
    const booking = await this.validatePartnerBooking(bookingId, partnerId);

    if (booking.status !== BookingStatus.PAID_PENDING_PARTNER_APPROVAL) {
      throw new BadRequestException('Booking is not awaiting approval');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        property: true,
        bookingItems: { include: { roomType: true } },
        payment: true,
        user: { select: { email: true, phone: true, profile: true } },
      },
    });
  }

  async rejectBooking(bookingId: string, partnerId: string, reason?: string) {
    const booking = await this.validatePartnerBooking(bookingId, partnerId);

    if (booking.status !== BookingStatus.PAID_PENDING_PARTNER_APPROVAL) {
      throw new BadRequestException('Booking is not awaiting approval');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        partnerNote: reason,
      },
      include: { payment: true },
    });

    // Trigger refund
    if (updated.payment?.status === PaymentStatus.PAID) {
      await this.prisma.payment.update({
        where: { id: updated.payment.id },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
      });
    }

    return updated;
  }

  private async validatePartnerBooking(bookingId: string, partnerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.property.partnerId !== partnerId) {
      throw new ForbiddenException('Not your property booking');
    }

    return booking;
  }
}
