import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentAdapter, PaymentRequest, PaymentResponse, RefundRequest,
} from './payment.interface';

@Injectable()
export class MockPaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(MockPaymentAdapter.name);

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.warn(`[MOCK] Creating payment for booking ${request.bookingId}: ${request.amount} ${request.currency}`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const transactionId = `MOCK-${uuidv4()}`;

    return {
      success: true,
      transactionId,
      paymentUrl: `https://mock-payment.uclicky.com/pay/${transactionId}`,
      providerReference: transactionId,
    };
  }

  async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    this.logger.warn(`[MOCK] Verifying payment: ${transactionId}`);
    await new Promise((resolve) => setTimeout(resolve, 200));

    return { verified: true, status: 'PAY_SUCCESS' };
  }

  async refund(request: RefundRequest): Promise<{ success: boolean }> {
    this.logger.warn(`[MOCK] Refunding: ${request.transactionId}, amount: ${request.amount}`);
    await new Promise((resolve) => setTimeout(resolve, 300));

    return { success: true };
  }
}
