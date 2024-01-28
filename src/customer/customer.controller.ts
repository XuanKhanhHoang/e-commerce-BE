import {
  Controller,
  Get,
  Logger,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('customer')
@UseGuards(AuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}
  @Get('customerDetail')
  getCustomerDetail(@Req() req: Request) {
    const customer_id = (req as any).user.user_id;
    return this.customerService.getCustomerDetail(customer_id);
  }
  @Get('orderlist')
  getOrderList(
    @Req() req: Request,
    @Query('page', new ParseIntPipe({ optional: true }))
    page: number | undefined,
  ) {
    const customer_id = (req as any).user.user_id;
    return this.customerService.getOrderList(customer_id, page);
  }
}
