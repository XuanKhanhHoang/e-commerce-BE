import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductService } from './products.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  // imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductService],
})
export class ProductModule {}
