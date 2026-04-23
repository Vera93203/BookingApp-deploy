import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { KbzPayAdapter } from './adapters/kbzpay.adapter';
import { CardPaymentAdapter } from './adapters/card-payment.adapter';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, KbzPayAdapter, CardPaymentAdapter, MockPaymentAdapter],
  exports: [PaymentsService],
})
export class PaymentsModule {}
