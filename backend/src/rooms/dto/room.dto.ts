import {
  IsString, IsOptional, IsNumber, IsArray, IsInt,
  Min, IsNotEmpty, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe Double Room' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  maxGuests: number;

  @ApiPropertyOptional({ example: 'King' })
  @IsOptional()
  @IsString()
  bedType?: string;

  @ApiPropertyOptional({ example: 35.5 })
  @IsOptional()
  @IsNumber()
  roomSize?: number;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ default: 'MMK' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: ['wifi', 'minibar', 'aircon'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalRooms?: number;
}

export class UpdateRoomTypeDto extends CreateRoomTypeDto {}
