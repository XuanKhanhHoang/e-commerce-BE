import { Module } from '@nestjs/common';
import { WebinfoController } from './webinfo.controller';
import { WebinfoService } from './webinfo.service';

@Module({
  controllers: [WebinfoController],
  providers: [WebinfoService]
})
export class WebinfoModule {}
