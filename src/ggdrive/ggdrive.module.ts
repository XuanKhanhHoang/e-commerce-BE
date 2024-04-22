import { Global, Module } from '@nestjs/common';
import { GoogleDriveService } from './ggdrive.service';
@Global()
@Module({
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
