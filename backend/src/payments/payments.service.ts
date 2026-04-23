import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { KbzPayAdapter } from './adapters/kbzpay.adapter';
import { CardPaymentAdapter } from './adapters/card-payment.adapter';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { PaymentAdapter } from './adapters/payment.interface';
import { BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private adapters: Record<string, PaymentAdapter>;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private kbzPayAdapter: KbzPayAdapter,
    private cardPaymentAdapter: CardPaymentAdapter,
    private mockPaymentAdapter: MockPaymentAdapter,
  ) {
    const forceMock = String(this.configService.get('FORCE_DEV_PAYMENT_MOCK')).toLowerCase() === 'true';
    const useMock = this.configService.get('NODE_ENV') === 'development' || forceMock;

    this.adapters = {
      KBZPAY: useMock ? this.mockPaymentAdapter : this.kbzPayAdapter,
      CARD: useMock ? this.mockPaymentAdapter : this.cardPaymentAdapter,
    };

    this.logger.log(`Payment adapters initialized (mock: ${useMock})`);
  }

  async createPayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, property: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new BadRequestException('Not your booking');
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Booking is not in pending payment status');
    }

    const payment = booking.payment;
    if (!payment) throw new BadRequestException('Payment record not found');

    const adapter = this.adapters[payment.method];
    if (!adapter) throw new BadRequestException(`Unsupported payment method: ${payment.method}`);

    const callbackUrl = this.configService.get<string>(
      'KBZPAY_CALLBACK_URL',
      'http://localhost:3003/api/payments/kbzpay/webhook',
    );

    const result = await adapter.createPayment({
      bookingId: booking.id,
      amount: payment.amount,
      currency: payment.currency,
      description: `UCLICK-Y Booking at ${booking.property.name}`,
      callbackUrl,
    });

    if (!result.success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PAYMENT_FAILED },
      });

      throw new BadRequestException(result.error || 'Payment creation failed');
    }

    // Update payment with transaction reference
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        transactionId: result.transactionId,
        providerReference: result.providerReference,
      },
    });

    return {
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
      clientSecret: result.providerReference,
      method: payment.method,
    };
  }

  async handleKbzPayWebhook(body: any) {
    this.logger.log('KBZPay webhook received', JSON.stringify(body));

    // Verify signature in production
    if (this.configService.get('NODE_ENV') !== 'development') {
      const isValid = this.kbzPayAdapter.verifyWebhookSignature(body, body.sign);
      if (!isValid) {
        this.logger.error('Invalid KBZPay webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    const orderId = body.order_id || body.merch_order_id;
    if (!orderId) throw new BadRequestException('Missing order ID');

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: orderId },
      include: { booking: true },
    });

    if (!payment) {
      this.logger.error(`Payment not found for order: ${orderId}`);
      throw new NotFoundException('Payment not found');
    }

    const tradeStatus = body.trade_status;

    if (tradeStatus === 'PAY_SUCCESS') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            providerResponse: body,
          },
        }),
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.PAID_PENDING_PARTNER_APPROVAL },
        }),
      ]);
      this.logger.log(`Payment confirmed for booking: ${payment.bookingId}`);
    } else {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            providerResponse: body,
          },
        }),
        this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.PAYMENT_FAILED },
        }),
      ]);
      this.logger.warn(`Payment failed for booking: ${payment.bookingId}`);
    }

    return { success: true };
  }

  async handleStripeWebhook(body: any) {
    this.logger.log('Stripe webhook received');

    const event = body;
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: paymentIntent.id },
      });

      if (payment) {
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt: new Date(),
              providerResponse: paymentIntent,
            },
          }),
          this.prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.PAID_PENDING_PARTNER_APPROVAL },
          }),
        ]);
      }
    }

    return { received: true };
  }

  // Simulate payment completion for dev
  async simulatePaymentSuccess(bookingId: string) {
    if (this.configService.get('NODE_ENV') !== 'development') {
      throw new BadRequestException('Only available in development');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PAID_PENDING_PARTNER_APPROVAL },
      }),
    ]);

    return { success: true, message: 'Payment simulated successfully' };
  }

  async getPaymentStatus(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
