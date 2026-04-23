export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  customerPhone?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  providerReference?: string;
  error?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface PaymentAdapter {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }>;
  refund(request: RefundRequest): Promise<{ success: boolean }>;
}
