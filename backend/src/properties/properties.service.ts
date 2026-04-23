import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto, SearchPropertiesDto } from './dto/property.dto';
import { PropertyStatus, Prisma } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchPropertiesDto) {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.APPROVED,
      isActive: true,
    };

    if (dto.city) {
      where.city = { contains: dto.city, mode: 'insensitive' };
    }
    if (dto.country) {
      where.country = { contains: dto.country, mode: 'insensitive' };
    }
    if (dto.query) {
      where.OR = [
        { name: { contains: dto.query, mode: 'insensitive' } },
        { city: { contains: dto.query, mode: 'insensitive' } },
        { description: { contains: dto.query, mode: 'insensitive' } },
      ];
    }
    if (dto.minRating) {
      where.starRating = { gte: dto.minRating };
    }
    if (dto.guests) {
      where.roomTypes = {
        some: { maxGuests: { gte: dto.guests }, isActive: true },
      };
    }
    if (dto.minPrice || dto.maxPrice) {
      where.roomTypes = {
        some: {
          isActive: true,
          basePrice: {
            ...(dto.minPrice ? { gte: dto.minPrice } : {}),
            ...(dto.maxPrice ? { lte: dto.maxPrice } : {}),
          },
        },
      };
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput = {};
    if (dto.sortBy === 'price') {
      orderBy.roomTypes = { _count: 'asc' };
    } else {
      orderBy.createdAt = 'desc';
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          roomTypes: {
            where: { isActive: true },
            orderBy: { basePrice: 'asc' },
            take: 1,
          },
          partner: {
            select: { businessName: true },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      properties: properties.map((p) => ({
        ...p,
        startingPrice: p.roomTypes[0]?.basePrice ?? null,
        currency: p.roomTypes[0]?.currency ?? 'MMK',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        roomTypes: {
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
        },
        partner: {
          select: { businessName: true, businessEmail: true, businessPhone: true },
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(partnerId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ...dto,
        partnerId,
        status: PropertyStatus.PENDING_APPROVAL,
      },
      include: { roomTypes: true },
    });
  }

  async update(id: string, partnerId: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.partnerId !== partnerId) throw new ForbiddenException('Not your property');

    return this.prisma.property.update({
      where: { id },
      data: dto,
      include: { roomTypes: true },
    });
  }

  async delete(id: string, partnerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.partnerId !== partnerId) throw new ForbiddenException('Not your property');

    await this.prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  async getPartnerProperties(partnerId: string) {
    return this.prisma.property.findMany({
      where: { partnerId, isActive: true },
      include: { roomTypes: { where: { isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForPartner(propertyId: string, partnerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, partnerId, isActive: true },
      include: { roomTypes: { where: { isActive: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  /** Append uploaded image URLs; enforces ownership via partner row for this user. */
  async appendPartnerPropertyImages(propertyId: string, userId: string, urls: string[]) {
    const partner = await this.prisma.partner.findUnique({ where: { userId } });
    if (!partner) throw new ForbiddenException('Partner profile required');

    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.partnerId !== partner.id) throw new ForbiddenException('Not your property');

    const existing = Array.isArray(property.images) ? [...property.images] : [];
    const maxImages = 20;
    const merged = [...existing, ...urls].slice(0, maxImages);

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { images: merged },
      include: { roomTypes: { where: { isActive: true } } },
    });
  }
}
