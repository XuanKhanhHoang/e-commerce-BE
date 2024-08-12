import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductService } from './products.service';
import { CacheModule } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        isGlobal: true,
        ttl: Number(configService.get('LOCAL_REDIS_CACHE_TTL')),
        host: configService.get('LOCAL_REDIS_HOST'),
        port: configService.get('LOCAL_REDIS_PORT'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductService],
})
export class ProductModule {}
