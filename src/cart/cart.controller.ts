import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}
  @Get('getcart')
  get(@Req() req: Request) {
    const customer_id = (req as any).user.user_id;
    return this.cartService.get(customer_id);
  }
  @Post('updatecart')
  updateCart(@Req() req: Request, @Body() bd) {
    const customer_id = (req as any).user.user_id;
    return this.cartService.update(customer_id, bd);
  }
}
