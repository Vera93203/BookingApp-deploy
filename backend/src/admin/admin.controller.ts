import {
  Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('partners/pending')
  @ApiOperation({ summary: 'Get pending partner applications' })
  async getPendingPartners() {
    return this.adminService.getPendingPartners();
  }

  @Post('partners/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a partner' })
  async approvePartner(@Param('id') id: string) {
    return this.adminService.approvePartner(id);
  }

  @Post('partners/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a partner' })
  async rejectPartner(@Param('id') id: string) {
    return this.adminService.rejectPartner(id);
  }

  @Get('properties/pending')
  @ApiOperation({ summary: 'Get pending properties' })
  async getPendingProperties() {
    return this.adminService.getPendingProperties();
  }

  @Post('properties/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a property' })
  async approveProperty(@Param('id') id: string) {
    return this.adminService.approveProperty(id);
  }

  @Post('properties/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a property' })
  async rejectProperty(@Param('id') id: string) {
    return this.adminService.rejectProperty(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async getAllUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List all bookings' })
  async getAllBookings(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllBookings(page, limit);
  }
}
