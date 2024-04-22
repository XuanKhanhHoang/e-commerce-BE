import {
  Body,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  @Post('addproduct')
  addProductToCart(
    @Req() req: Request,
    @Body('option_id', ParseIntPipe) option_id: number,
  ) {
    const customer_id = (req as any).user.user_id;
    return this.cartService.addProrduct(customer_id, option_id);
  }
  @Delete('deleteproduct')
  delete(@Req() req: Request, @Body('cart_id', ParseIntPipe) cart_id: number) {
    const customer_id = (req as any).user.user_id;
    return this.cartService.delete(customer_id, cart_id);
  }
}
