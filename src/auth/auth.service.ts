import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginResponse, UserLoginDTO, userGeneral } from './dto/login.dto';
import { Role, adminRole, customerRole } from './roles.enum';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { OTPAuthForgotPassword } from './dto/OTPAuthForgotPassword.dto';
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async RefreshInfoByAccessToken(
    userId: number,
    role: Role,
  ): Promise<{ access_token: string; value: userGeneral }> {
    try {
      if (userId != undefined && role != adminRole) {
        let user = await this.prismaService.user.findUnique({
          where: {
            is_deleted: false,
            user_id: userId,
            is_auth: true,
          },
        });
        if (!user) throw new UnauthorizedException('Not found');
        let access_token = await this.jwtService.signAsync({
          user_id: user.user_id,
          role: customerRole,
        });
        return {
          access_token: access_token,
          value: {
            user_id: user.user_id,
            first_name: user.first_name,
            avatar: user.avartar,
            ROLE: customerRole,
          },
        };
      }
    } catch (e) {
      if (e.status == 500) throw new InternalServerErrorException();
      throw new BadRequestException('authorization failed');
    }
  }
  async Login(data: UserLoginDTO): Promise<LoginResponse> {
    let user = await this.prismaService.user.findFirst({
      where: {
        login_name: {
          equals: data.login_name,
        },
        is_deleted: false,
        is_auth: true,
      },
    });
    // return await bcrypt.hashSync('Khanhpopo1S', 12);
    if (!user) throw new UnauthorizedException('user or password wrong');
    let auth = await bcrypt.compare(data.password, user.login_password);
    if (!auth) throw new UnauthorizedException('user or password wrong');
    let access_token = await this.jwtService.signAsync({
      user_id: user.user_id,
      role: customerRole,
    });
    return {
      access_token: access_token,
      value: {
        user_id: user.user_id,
        first_name: user.first_name,
        avatar: user.avartar,
        ROLE: customerRole,
      },
    };
  }
  async LoginByFacebook(email: string, fb_id: string): Promise<LoginResponse> {
    let res = await this.prismaService.user_facebook.findFirst({
      where: {
        facebookId: fb_id,
        user: {
          is_auth: true,
          is_deleted: false,
        },
      },
      select: {
        user_id: true,
        user: {
          select: {
            first_name: true,
            avartar: true,
          },
        },
      },
    });
    if (!res) throw new NotFoundException("user isn't registered");

    let { user_id, user } = res;
    let { avartar, first_name } = user;
    if (!user_id) throw new NotFoundException("user isn't registered");
    let access_token = await this.jwtService.signAsync({
      user_id: user_id,
      role: customerRole,
    });
    return {
      access_token: access_token,
      value: {
        user_id: user_id,
        first_name: first_name,
        avatar: avartar,
        ROLE: customerRole,
      },
    };
  }
  async AuthRegisterOTP(otp: String) {
    const otp_code = Number(otp);
    const res = await this.prismaService.otp_code_queue.findFirst({
      where: {
        code: otp_code,
      },
    });
    if (!res) {
      throw new NotFoundException('OTP not found');
    }
    if (!res.is_valid) {
      throw new BadRequestException('OTP has been authenticated');
    }
    let currentTime = new Date().getTime();

    // Lấy độ lệch múi giờ của máy chủ/client (trả về giá trị tính bằng phút)
    let timezoneOffset = new Date().getTimezoneOffset() * 60000; // Chuyển đổi sang mili giây

    // Tạo thời gian không hợp lệ mới dựa trên múi giờ cục bộ
    let localCurrentTime = new Date(currentTime - timezoneOffset);
    if (res.invalid_time.getTime() < localCurrentTime.getTime()) {
      throw new BadRequestException('OPT expried');
    }
    const { email } = await this.prismaService.otp_code_queue.update({
      where: {
        id: res.id,
      },
      data: {
        is_valid: false,
      },
      select: {
        email: true,
      },
    });
    await this.prismaService.user.update({
      where: {
        email: email,
      },
      data: {
        is_auth: true,
      },
    });
    return {
      message: 'Xác thực thành công ,vui lòng đăng nhập ',
    };
  }

  async AuthForgotPasswordOTP(data: OTPAuthForgotPassword) {
    const otp_code = Number(data.otp);
    const { email } = data;
    const res = await this.prismaService.otp_code_queue.findFirst({
      where: {
        code: otp_code,
        email: email,
      },
    });
    if (!res) {
      throw new NotFoundException('OTP not found');
    }
    if (!res.is_valid) {
      throw new BadRequestException('OTP has been authenticated');
    }
    let currentTime = new Date().getTime();
    let timezoneOffset = new Date().getTimezoneOffset() * 60000;
    let localCurrentTime = new Date(currentTime - timezoneOffset);
    if (res.invalid_time.getTime() < localCurrentTime.getTime()) {
      throw new BadRequestException('OPT expried');
    }
    await this.prismaService.otp_code_queue.update({
      where: {
        id: res.id,
      },
      data: {
        is_valid: false,
      },
    });
    const { user_id } = await this.prismaService.user.findFirst({
      where: {
        email: email,
      },
      select: {
        user_id: true,
      },
    });
    let access_token = await this.jwtService.signAsync({
      user_id: user_id,
      role: customerRole,
    });
    return {
      access_token: access_token,
    };
  }
}
