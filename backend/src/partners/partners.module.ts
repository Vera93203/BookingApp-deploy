import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { BookingsModule } from '../bookings/bookings.module';
import { EmailModule } from '../email/email.module';
import { PropertiesModule } from '../properties/properties.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [BookingsModule, EmailModule, PropertiesModule, RoomsModule],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
