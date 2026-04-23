import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPartnerDto {
  @ApiProperty({ example: 'Golden Palace Hotels' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'info@goldenpalace.com' })
  @IsEmail()
  businessEmail: string;

  @ApiProperty({ example: '+959123456789' })
  @IsString()
  @IsNotEmpty()
  businessPhone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

export class RejectBookingDto {
  @ApiPropertyOptional({ example: 'Rooms not available for those dates' })
  @IsOptional()
  @IsString()
  reason?: string;
}
