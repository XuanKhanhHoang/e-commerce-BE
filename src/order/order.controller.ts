import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { createOrderDTO } from './dto/createOrder.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { VNpayPaymentsService } from 'src/payments/vnpay_payments.service';
import { payment_method } from '../payments/payment_method_id.data';
import getDeliveryFee from 'src/utils/getDeliveryFee';
import { Request } from 'express';

@Controller('order')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private vnPayPaymentsService: VNpayPaymentsService,
  ) {}
  @UseGuards(AuthGuard)
  @Post('create_order')
  async createOrder(@Req() req: any, @Body() body: createOrderDTO) {
    const customer_id = (req as any).user.user_id;
    let data = body;
    let ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    let res = await this.orderService.createOrder(
      customer_id,
      data,
      body.payment_method_id,
    );
    if (body.payment_method_id != payment_method.vnpay) return res;
    return await this.vnPayPaymentsService.createPayment(
      ipAddr,
      res.order_id,
      res.total_price,
    );
  }
  @UseGuards(AuthGuard)
  @Get('/get_payment_url_for_order')
  async getPaymentUrlForOrder(
    @Req() req: any,
    @Query('order_id', new ParseIntPipe()) order_id: number,
  ) {
    const customer_id = (req as any).user.user_id;
    let ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    let total_price = await this.orderService.getValueOfOrder(
      order_id,
      customer_id,
    );
    return await this.vnPayPaymentsService.createPayment(
      ipAddr,
      order_id,
      total_price,
    );
  }
  @UseGuards(AuthGuard)
  @Get('orderlist')
  getOrderList(
    @Req() req: Request,
    @Query('status_id', new ParseIntPipe({ optional: true }))
    statusId: any,
    @Query('page', new ParseIntPipe({ optional: true }))
    page: any,
  ) {
    const customer_id = (req as any).user.user_id;
    return this.orderService.getOrderList(customer_id, page, statusId);
  }
  @UseGuards(AuthGuard)
  @Get('get_order')
  getAnOrder(
    @Req() req: Request,
    @Query('order_id', new ParseIntPipe())
    orderId: number,
  ) {
    const customer_id = (req as any).user.user_id;
    return this.orderService.getOrder(orderId, customer_id);
  }
  @UseGuards(AuthGuard)
  @Put('cancel_order')
  @HttpCode(200)
  CancelAnOrder(
    @Req() req: Request,
    @Body('order_id', new ParseIntPipe())
    orderId: number,
    @Body('reason') reason: string | undefined,
  ) {
    const customer_id = (req as any).user.user_id;
    return this.orderService.cancelAnOrder(orderId, customer_id);
  }
  @Get('/get_delivery_fee')
  async getDeliveryFee(
    @Query('district_id', {
      transform: (val, meta) => {
        return Number(val);
      },
    })
    district_id: number,
  ) {
    if (isNaN(district_id) || district_id < 0 || district_id > 1500)
      throw new BadRequestException('district_id invalid');
    return getDeliveryFee(district_id);
  }
}
