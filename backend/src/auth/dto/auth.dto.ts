import {
  IsString, IsNotEmpty, Length, IsOptional, IsISO31661Alpha2,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: 'MM',
    description: 'ISO 3166-1 alpha-2; used to parse national numbers without +',
  })
  @IsString()
  @IsNotEmpty()
  @IsISO31661Alpha2()
  country: string;

  @ApiProperty({ example: '+447774413249', description: 'E.164 or national digits for `country`' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'MM' })
  @IsString()
  @IsNotEmpty()
  @IsISO31661Alpha2()
  country: string;

  @ApiProperty({ example: '+447774413249' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code: string;
}

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token from Flutter Google Sign-In' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({ example: 'MM', description: 'Optional; stored on user when provided' })
  @IsOptional()
  @IsString()
  @IsISO31661Alpha2()
  country?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
