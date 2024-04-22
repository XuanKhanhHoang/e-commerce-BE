import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
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
  @UsePipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  @UseGuards(AuthGuard)
  async updateDetail(
    @UploadedFile() file: Express.Multer.File,
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
  @UseInterceptors(FileInterceptor('avatar'))
  async createNewCustomer(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateNewCustomer,
  ) {
    return this.customerService.createNewCustomer(body, file);
  }

  @Post('create_new_customer_and_facbook_token')
  @UseInterceptors(FileInterceptor('avatar'))
  async createNewCustomerAndFacebookToken(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateNewCustomerAndFacebookToken,
  ) {
    return this.customerService.createNewCustomerAndFacebookToken(body, file);
  }
}
