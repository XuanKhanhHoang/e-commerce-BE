import { Controller, Get, Req, Res } from '@nestjs/common';
import { VNpayPaymentsService } from './vnpay_payments.service';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private vnPayService: VNpayPaymentsService) {}
  @Get('vnpay/vnpreturn')
  async vnpayReturn(@Req() req: Request, @Res() res: Response) {
    let vnp_Params = req.query;
    let fe_return_url = process.env.FE_PAYMENT_RETURN_URL;
    let order = await this.vnPayService.handleVnPayReturn(vnp_Params);
    return res.redirect(
      fe_return_url + `?order_id=${order.orderId}&status=${order.status}`,
    );
  }
}
