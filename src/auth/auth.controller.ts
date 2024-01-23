import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDTO } from './dto/login.dto';
@Controller('auth')
export class AuthController {
  constructor(private authServices: AuthService) {}

  @Post('/getinfobyaccesstoken')
  GetInfoByAccessToken(@Body('token') token: string) {
    if (token == undefined) throw new BadRequestException();
    return this.authServices.GetInfoByAccessToken(token);
  }
  @Post('/login')
  @UsePipes(new ValidationPipe())
  async HandleLogin(@Body() data: UserLoginDTO) {
    return this.authServices.Login(data);
  }
}
