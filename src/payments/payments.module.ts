import { Module } from '@nestjs/common';
import { VNpayPaymentsService } from './vnpay_payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  providers: [VNpayPaymentsService],
  exports: [VNpayPaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
