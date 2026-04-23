import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, SearchPropertiesDto } from './dto/property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search properties with filters' })
  async search(@Query() dto: SearchPropertiesDto) {
    return this.propertiesService.search(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get property details by ID' })
  async findById(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }
}
