import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebinfoService {
  constructor(private prismaService: PrismaService) {}
  getPromotionBanner() {
    return this.prismaService.promotion_banner.findMany({
      where: {
        is_active: true,
      },
    });
  }
}
