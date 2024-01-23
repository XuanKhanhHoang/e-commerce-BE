import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './products/products.module';
import { WebinfoModule } from './webinfo/webinfo.module';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProductModule,
    WebinfoModule,
    AuthModule,
    CustomerModule,
  ],
})
export class AppModule {}
