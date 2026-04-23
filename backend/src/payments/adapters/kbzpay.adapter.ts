import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  PaymentAdapter, PaymentRequest, PaymentResponse, RefundRequest,
} from './payment.interface';

@Injectable()
export class KbzPayAdapter implements PaymentAdapter {
  private readonly logger = new Logger(KbzPayAdapter.name);
  private readonly apiUrl: string;
  private readonly merchantCode: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private configService: ConfigService) {
    const forceMock = String(this.configService.get('FORCE_DEV_PAYMENT_MOCK')).toLowerCase() === 'true';
    const isDev = this.configService.get<string>('NODE_ENV') === 'development' || forceMock;
    const placeholder = isDev ? 'dev-not-used' : '';

    this.apiUrl = this.configService.get<string>('KBZPAY_API_URL') || placeholder;
    this.merchantCode = this.configService.get<string>('KBZPAY_MERCHANT_CODE') || placeholder;
    this.apiKey = this.configService.get<string>('KBZPAY_API_KEY') || placeholder;
    this.apiSecret = this.configService.get<string>('KBZPAY_API_SECRET') || placeholder;

    if (!isDev && (!this.apiUrl || !this.merchantCode || !this.apiKey || !this.apiSecret)) {
      throw new Error(
        'KBZPAY_API_URL, KBZPAY_MERCHANT_CODE, KBZPAY_API_KEY, and KBZPAY_API_SECRET are required in production',
      );
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const orderId = `UCLICKY-${request.bookingId}-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const payload = {
        timestamp,
        method: 'kbzpay.payment.precreate',
        notify_url: request.callbackUrl,
        merchant_code: this.merchantCode,
        order_id: orderId,
        amount: request.amount.toFixed(2),
        currency: request.currency || 'MMK',
        description: request.description,
        trade_type: 'APP',
      };

      // Generate signature
      const signString = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${(payload as any)[key]}`)
        .join('&');
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(signString)
        .digest('hex');

      const response = await axios.post(
        `${this.apiUrl}/precreate`,
        { ...payload, sign: signature, sign_type: 'SHA256' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      if (response.data?.Response?.code === '0') {
        return {
          success: true,
          transactionId: orderId,
          paymentUrl: response.data.Response.prepay_id,
          providerReference: response.data.Response.prepay_id,
        };
      }

      this.logger.error('KBZPay create payment failed', response.data);
      return {
        success: false,
        error: response.data?.Response?.msg || 'Payment creation failed',
      };
    } catch (error) {
      this.logger.error('KBZPay API error', error);
      return { success: false, error: 'KBZPay service unavailable' };
    }
  }

  async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        timestamp,
        method: 'kbzpay.payment.queryorder',
        merchant_code: this.merchantCode,
        order_id: transactionId,
      };

      const signString = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${(payload as any)[key]}`)
        .join('&');
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(signString)
        .digest('hex');

      const response = await axios.post(
        `${this.apiUrl}/queryorder`,
        { ...payload, sign: signature, sign_type: 'SHA256' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 15000,
        },
      );

      const tradeStatus = response.data?.Response?.trade_status;
      return {
        verified: tradeStatus === 'PAY_SUCCESS',
        status: tradeStatus || 'UNKNOWN',
      };
    } catch (error) {
      this.logger.error('KBZPay verify error', error);
      return { verified: false, status: 'ERROR' };
    }
  }

  async refund(request: RefundRequest): Promise<{ success: boolean }> {
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        timestamp,
        method: 'kbzpay.payment.refund',
        merchant_code: this.merchantCode,
        order_id: request.transactionId,
        refund_amount: request.amount.toFixed(2),
        refund_reason: request.reason || 'Booking rejected',
      };

      const signString = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${(payload as any)[key]}`)
        .join('&');
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(signString)
        .digest('hex');

      const response = await axios.post(
        `${this.apiUrl}/refund`,
        { ...payload, sign: signature, sign_type: 'SHA256' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      return { success: response.data?.Response?.code === '0' };
    } catch (error) {
      this.logger.error('KBZPay refund error', error);
      return { success: false };
    }
  }

  verifyWebhookSignature(body: any, receivedSignature: string): boolean {
    const signString = Object.keys(body)
      .filter((key) => key !== 'sign' && key !== 'sign_type')
      .sort()
      .map((key) => `${key}=${body[key]}`)
      .join('&');
    const expectedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signString)
      .digest('hex');
    return expectedSignature === receivedSignature;
  }
}
