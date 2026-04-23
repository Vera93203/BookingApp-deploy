import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { RegisterPartnerDto, RejectBookingDto } from './dto/partner.dto';
import { CreatePropertyDto, UpdatePropertyDto } from '../properties/dto/property.dto';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../rooms/dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partner')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register as a partner' })
  async register(@CurrentUser('id') userId: string, @Body() dto: RegisterPartnerDto) {
    return this.partnersService.registerPartner(userId, dto);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Get partner profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.partnersService.getPartnerByUserId(userId);
  }

  // Property management
  @Post('properties')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Create a property' })
  async createProperty(@CurrentUser('id') userId: string, @Body() dto: CreatePropertyDto) {
    return this.partnersService.createProperty(userId, dto);
  }

  @Get('properties')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Get my properties' })
  async getMyProperties(@CurrentUser('id') userId: string) {
    return this.partnersService.getMyProperties(userId);
  }

  @Get('properties/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Get one of my properties' })
  async getMyProperty(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.partnersService.getMyProperty(userId, id);
  }

  @Put('properties/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Update a property' })
  async updateProperty(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.partnersService.updateProperty(userId, id, dto);
  }

  // Room management
  @Post('properties/:propertyId/rooms')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Add room type to property' })
  async createRoom(
    @CurrentUser('id') userId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.partnersService.createRoom(userId, propertyId, dto);
  }

  @Put('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Update room type' })
  async updateRoom(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.partnersService.updateRoom(userId, id, dto);
  }

  @Delete('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Delete room type' })
  async deleteRoom(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.partnersService.deleteRoom(userId, id);
  }

  // Booking management
  @Get('bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Get bookings for my properties' })
  async getBookings(@CurrentUser('id') userId: string) {
    return this.partnersService.getBookings(userId);
  }

  @Post('bookings/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a booking → sends confirmation email' })
  async approveBooking(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.partnersService.approveBooking(userId, id);
  }

  @Post('bookings/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a booking → triggers refund + rejection email' })
  async rejectBooking(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RejectBookingDto,
  ) {
    return this.partnersService.rejectBooking(userId, id, dto.reason);
  }
}
