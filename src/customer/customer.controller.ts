import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { updateUserDetailDTO } from './dto/updateUserDetail.dto';
import { CreateNewCustomer } from './dto/CreateNewCustomer.dto';
import { CreateNewCustomerAndFacebookToken } from './dto/CreateNewCustomerAndFacebookToken.dto';
import { EmailDTO } from './dto/EmailDTO.dto';
@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}
  @Get('customer_detail')
  @UseGuards(AuthGuard)
  getCustomerDetail(@Req() req: Request) {
    const customer_id = (req as any).user.user_id;
    return this.customerService.getCustomerDetail(customer_id);
  }

  @Put('update_detail')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @HttpCode(200)
  @UsePipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  @UseGuards(AuthGuard)
  async updateDetail(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 3000 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
    @Body() body: updateUserDetailDTO,
    @Req() req: Request,
  ) {
    let user_id = (req as any).user.user_id;
    let userId = await this.customerService.updateUserDetail(
      user_id,
      body,
      file,
    );
    return { success: true, user_id: userId };
  }

  @Post('create_new_customer')
  async createNewCustomer(@Body() body: CreateNewCustomer) {
    return this.customerService.createNewCustomer(body);
  }
  @Post('app/get_otp_to_forgot_password')
  async GetOTPtoForgotPassword(@Body() body: EmailDTO) {
    return this.customerService.GetOTPtoForgotPassword(body.email);
  }
  @Post('web/get_forgot_password_link')
  async GetForgotPasswordLink(@Body() body: EmailDTO) {
    return this.customerService.GetForgotPasswordLink(body.email);
  }
  @Post('change_password')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async ChangePassword(
    @Req() req: Request,
    @Body('new_password') newPassword: string,
  ) {
    const customer_id = (req as any).user.user_id;
    return this.customerService.ChangePassword(newPassword, customer_id);
  }
}
