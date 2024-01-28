import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
  implements OnModuleInit
{
  constructor(configServive: ConfigService) {
    super({
      datasources: {
        db: {
          url: configServive.get('DATABASE_URL'),
        },
      },
      // log: [
      //   {
      //     emit: 'stdout',
      //     level: 'query',
      //   },
      //   {
      //     emit: 'stdout',
      //     level: 'error',
      //   },
      //   {
      //     emit: 'stdout',
      //     level: 'info',
      //   },
      //   {
      //     emit: 'stdout',
      //     level: 'warn',
      //   },
      // ],
      errorFormat: 'colorless',
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
