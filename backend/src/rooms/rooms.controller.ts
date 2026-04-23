import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Public()
  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get all room types for a property' })
  async findByProperty(@Param('propertyId') propertyId: string) {
    return this.roomsService.findByProperty(propertyId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get room type details' })
  async findById(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @Public()
  @Get(':id/availability')
  @ApiOperation({ summary: 'Check room availability for dates' })
  async checkAvailability(
    @Param('id') id: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.roomsService.checkAvailability(id, new Date(checkIn), new Date(checkOut));
  }
}
