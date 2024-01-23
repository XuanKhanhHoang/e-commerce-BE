import { Controller, Get } from '@nestjs/common';
import { WebinfoService } from './webinfo.service';

@Controller('webinfo')
export class WebinfoController {
  constructor(private readonly webInfoService: WebinfoService) {}

  @Get('promotionbanner')
  getPromotionBanner() {
    return this.webInfoService.getPromotionBanner();
  }
}
