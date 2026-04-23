import {
  Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment for a booking' })
  async createPayment(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createPayment(bookingId, userId);
  }

  @Public()
  @Post('kbzpay/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'KBZPay payment webhook callback' })
  async kbzPayWebhook(@Body() body: any) {
    return this.paymentsService.handleKbzPayWebhook(body);
  }

  @Public()
  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe payment webhook callback' })
  async stripeWebhook(@Body() body: any) {
    return this.paymentsService.handleStripeWebhook(body);
  }

  @Post('simulate/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[DEV ONLY] Simulate successful payment' })
  async simulatePayment(@Param('bookingId') bookingId: string) {
    return this.paymentsService.simulatePaymentSuccess(bookingId);
  }

  @Get(':bookingId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for a booking' })
  async getPaymentStatus(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentStatus(bookingId);
  }
}
