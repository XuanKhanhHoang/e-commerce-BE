import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './products/products.module';
import { WebinfoModule } from './webinfo/webinfo.module';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { GoogleDriveModule } from './ggdrive/ggdrive.module';
import { FacebookAuthModule } from 'facebook-auth-nestjs';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FacebookAuthModule.forRoot({
      clientId: Number(process.env.FB_CLIENT_APP_ID),
      clientSecret: process.env.FB_CLIENT_APP_SECRET,
    }),
    PrismaModule,
    ProductModule,
    WebinfoModule,
    AuthModule,
    CustomerModule,
    CartModule,
    OrderModule,
    GoogleDriveModule,
  ],
})
export class AppModule {}
