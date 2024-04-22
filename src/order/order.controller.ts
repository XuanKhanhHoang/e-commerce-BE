import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { createOrderDTO } from './dto/createOrder.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('order')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post('create_order')
  async createOrder(@Req() req: Request, @Body() body: createOrderDTO) {
    const customer_id = (req as any).user.user_id;
    let data = body.data;
    return this.orderService.createOrder(
      customer_id,
      data,
      body.payment_method_id,
    );
  }
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
}
