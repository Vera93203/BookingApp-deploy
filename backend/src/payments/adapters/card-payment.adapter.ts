import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  PaymentAdapter, PaymentRequest, PaymentResponse, RefundRequest,
} from './payment.interface';

@Injectable()
export class CardPaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(CardPaymentAdapter.name);
  private readonly stripeSecretKey: string;
  private readonly stripeApiUrl = 'https://api.stripe.com/v1';

  constructor(private configService: ConfigService) {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    this.stripeSecretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      (isDev ? 'sk_test_dev_not_used_mock_payments' : '');
    if (!this.stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required when NODE_ENV is not development');
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('amount', Math.round(request.amount).toString());
      params.append('currency', (request.currency || 'usd').toLowerCase());
      params.append('description', request.description);
      params.append('metadata[booking_id]', request.bookingId);
      params.append('automatic_payment_methods[enabled]', 'true');

      const response = await axios.post(
        `${this.stripeApiUrl}/payment_intents`,
        params.toString(),
        {
          headers: {
            Authorization: `Bearer ${this.stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        },
      );

      return {
        success: true,
        transactionId: response.data.id,
        providerReference: response.data.client_secret,
      };
    } catch (error: any) {
      this.logger.error('Stripe create payment error', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Card payment failed',
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    try {
      const response = await axios.get(
        `${this.stripeApiUrl}/payment_intents/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${this.stripeSecretKey}` },
          timeout: 15000,
        },
      );

      return {
        verified: response.data.status === 'succeeded',
        status: response.data.status,
      };
    } catch (error) {
      this.logger.error('Stripe verify error', error);
      return { verified: false, status: 'ERROR' };
    }
  }

  async refund(request: RefundRequest): Promise<{ success: boolean }> {
    try {
      const params = new URLSearchParams();
      params.append('payment_intent', request.transactionId);
      params.append('amount', Math.round(request.amount).toString());

      const response = await axios.post(
        `${this.stripeApiUrl}/refunds`,
        params.toString(),
        {
          headers: {
            Authorization: `Bearer ${this.stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        },
      );

      return { success: response.data.status === 'succeeded' };
    } catch (error) {
      this.logger.error('Stripe refund error', error);
      return { success: false };
    }
  }
}
