import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findByProperty(propertyId: string) {
    return this.prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      orderBy: { basePrice: 'asc' },
    });
  }

  async findById(id: string) {
    const room = await this.prisma.roomType.findUnique({
      where: { id },
      include: { property: { select: { name: true, partnerId: true } } },
    });
    if (!room) throw new NotFoundException('Room type not found');
    return room;
  }

  async create(propertyId: string, partnerId: string, dto: CreateRoomTypeDto) {
    // Verify property belongs to partner
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.partnerId !== partnerId) throw new ForbiddenException('Not your property');

    return this.prisma.roomType.create({
      data: { ...dto, propertyId },
    });
  }

  async update(id: string, partnerId: string, dto: UpdateRoomTypeDto) {
    const room = await this.prisma.roomType.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!room) throw new NotFoundException('Room type not found');
    if (room.property.partnerId !== partnerId) throw new ForbiddenException('Not your property');

    return this.prisma.roomType.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, partnerId: string) {
    const room = await this.prisma.roomType.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!room) throw new NotFoundException('Room type not found');
    if (room.property.partnerId !== partnerId) throw new ForbiddenException('Not your property');

    await this.prisma.roomType.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  async checkAvailability(roomTypeId: string, checkIn: Date, checkOut: Date) {
    const room = await this.prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!room) throw new NotFoundException('Room type not found');

    // Count existing confirmed bookings for this room type in date range
    const overlappingBookings = await this.prisma.bookingItem.count({
      where: {
        roomTypeId,
        booking: {
          status: { in: ['PAID_PENDING_PARTNER_APPROVAL', 'CONFIRMED'] },
          OR: [
            { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
          ],
        },
      },
    });

    const available = room.totalRooms - overlappingBookings;
    return {
      roomTypeId,
      totalRooms: room.totalRooms,
      booked: overlappingBookings,
      available: Math.max(0, available),
      isAvailable: available > 0,
      pricePerNight: room.basePrice,
      currency: room.currency,
    };
  }
}
