import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDTO } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { FacebookAuthService } from 'facebook-auth-nestjs';
import { OTPAuthForgotPassword } from './dto/OTPAuthForgotPassword.dto';
@Controller('auth')
export class AuthController {
  constructor(
    private authServices: AuthService,
    private readonly facebookService: FacebookAuthService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('/refreshinfobyaccesstoken')
  RefreshInfoByAccessToken(@Req() req: Request) {
    const customer_id = (req as any).user.user_id;
    return this.authServices.RefreshInfoByAccessToken(
      customer_id,
      (req as any).user.role,
    );
  }
  @Post('/login')
  @UsePipes(new ValidationPipe())
  async HandleLogin(@Body() data: UserLoginDTO) {
    return this.authServices.Login(data);
  }
  @Post('/login_by_facebook')
  async LoginByFacbook(@Body('access_token') access_token) {
    const {
      email,
      id: facbook_id,
      name,
    } = await this.facebookService.getUser(access_token, 'id', 'email', 'name');
    if (!facbook_id || !email)
      throw new NotFoundException(
        "can't find facbook account from access_token",
      );
    return this.authServices.LoginByFacebook(email, facbook_id);
  }
  @Get('/otp_register/:otp')
  OTPAuthRegister(@Param('otp') otp: String) {
    if (otp == undefined || otp.length != 6 || Number.isNaN(Number(otp)))
      throw new BadRequestException('OTP Invalid');
    return this.authServices.AuthRegisterOTP(otp);
  }
  @Post('app/otp_forgot_password')
  OTPAuthForgotPassword(@Body() data: OTPAuthForgotPassword) {
    return this.authServices.AuthForgotPasswordOTP(data);
  }
}
