import {
  IsString, IsOptional, IsInt, IsDateString, IsArray,
  IsNotEmpty, ValidateNested, Min, IsUUID, IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BookingItemDto {
  @ApiProperty()
  @IsUUID()
  roomTypeId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-06-18' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  guestEmail?: string;

  @ApiProperty({ example: '+959123456789' })
  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  numberOfGuests: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiProperty({ type: [BookingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items: BookingItemDto[];

  @ApiProperty({ enum: ['KBZPAY', 'CARD'] })
  @IsEnum(['KBZPAY', 'CARD'])
  paymentMethod: 'KBZPAY' | 'CARD';
}
