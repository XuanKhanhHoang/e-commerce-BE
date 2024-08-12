import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order, UserFullDetail } from './dto/getUserDetailResponse';
import { updateUserDetailDTO } from './dto/updateUserDetail.dto';
import { GoogleDriveService } from 'src/ggdrive/ggdrive.service';
import { CreateNewCustomer } from './dto/CreateNewCustomer.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { customerRole } from 'src/auth/roles.enum';
import { CreateNewCustomerAndFacebookToken } from './dto/CreateNewCustomerAndFacebookToken.dto';
import { FacebookAuthService } from 'facebook-auth-nestjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CustomerService {
  constructor(
    private prismaService: PrismaService,
    private googleDriveService: GoogleDriveService,
    private jwtService: JwtService,
    private readonly facebookService: FacebookAuthService,
    private readonly mailerService: MailerService,
  ) {}
  private mailer_name = `"KTH Tech Shop " <Khanhpopo056@gmail.com>`;
  private async checkIsValidRegisterCustomerData(
    data: CreateNewCustomerAndFacebookToken | CreateNewCustomer,
  ) {
    let {
      address,
      email,
      first_name,
      gender: gender_IsMale,
      last_name,
      password,
      phone_number,
      user_name,
    } = data;
    let phoneRegex = /^(0?)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;
    address = address.trim();
    email = email.trim().toLocaleLowerCase();
    first_name = first_name.trim();
    last_name = last_name.trim();
    user_name = user_name.trim().toLocaleLowerCase();
    phone_number = phone_number.trim();
    password = password.trim();
    if (!phoneRegex.test(phone_number))
      throw new BadRequestException('phone_number is invalid');
    if (password.length < 6)
      throw new BadRequestException('password is too short');
    if (
      last_name.length == 0 ||
      first_name.length == 0 ||
      user_name.length == 0 ||
      address.length == 0
    )
      throw new BadRequestException(' data is invalid');
    let tmp = await this.prismaService.user.count({
      where: {
        is_deleted: false,
        email: email,
      },
    });
    if (
      (await this.prismaService.user.count({
        where: {
          is_deleted: false,
          email: { equals: email },
        },
      })) != 0 ||
      (await this.prismaService.user.count({
        where: {
          is_deleted: false,
          phone_number: phone_number,
        },
      })) != 0 ||
      (await this.prismaService.user.count({
        where: {
          is_deleted: false,
          login_name: user_name,
        },
      })) != 0
    )
      throw new HttpException(
        'email or phone_number or user_name is exist',
        409,
      );
  }
  public async createOTP(otp_type: number, email: string, validTime = 900000) {
    const min = 100000;
    const max = 999999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    let currentTime = new Date().getTime();
    // Lấy độ lệch múi giờ của máy chủ/client (trả về giá trị tính bằng phút)
    let timezoneOffset = new Date().getTimezoneOffset() * 60000; // Chuyển đổi sang mili giây
    // Tạo thời gian không hợp lệ mới dựa trên múi giờ cục bộ
    let invalidTime = new Date(currentTime - timezoneOffset + validTime);
    const data = await this.prismaService.otp_code_queue.create({
      data: {
        code: otp,
        email: email,
        type: otp_type,
        invalid_time: invalidTime,
      },
      select: {
        code: true,
        id: true,
      },
    });
    return data;
  }
  async getCustomerDetail(customerId: number): Promise<UserFullDetail> {
    let customer = await this.prismaService.user.findUnique({
      where: {
        user_id: customerId,
        is_deleted: false,
        is_auth: true,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        address: true,
        email: true,
        gender: true,
        avartar: true,
        login_name: true,
        phone_number: true,
      },
    });

    return customer;
  }
  async updateUserDetail(
    user_id: number,
    new_user_detail: updateUserDetailDTO,
    file: Express.Multer.File,
  ) {
    let user = await this.prismaService.user.findFirst({
      where: {
        user_id: user_id,
        is_deleted: false,
      },
    });
    if (user == undefined) {
      throw new NotFoundException('user not found');
    }
    let avatar: string | undefined;

    if (file != undefined) {
      try {
        avatar = 'user' + user_id + '_avatar';
        avatar = await this.googleDriveService.uploadFile(file, avatar);
      } catch (e) {
        throw new InternalServerErrorException('Upload avatar image error');
      }
    }
    let res = await this.prismaService.user.update({
      where: {
        is_deleted: false,
        user_id: user_id,
      },
      data: {
        login_name: new_user_detail.user_name
          ? new_user_detail.user_name
          : user.login_name,
        avartar: avatar != undefined ? avatar : user.avartar,
        gender: new_user_detail.gender,
        first_name:
          new_user_detail.first_name != undefined
            ? new_user_detail.first_name
            : user.first_name,
        last_name:
          new_user_detail.last_name != undefined
            ? new_user_detail.last_name
            : user.last_name,
        phone_number:
          new_user_detail.phone_number != undefined
            ? new_user_detail.phone_number
            : user.phone_number,
        address:
          new_user_detail.address != undefined
            ? new_user_detail.address
            : user.address,
      },
    });

    if (res.user_id) return res.user_id;
    throw new InternalServerErrorException('Error to update');
  }
  async checkEmailBeforeRegisterUser(email: string) {
    const otp_code_type_register = 1;
    const { code: otp } = await this.createOTP(otp_code_type_register, email);
    return this.mailerService.sendMail({
      from: 'this.mailer_name', // sender address
      to: email, // list of receivers
      subject: 'Xác thực email cho KTH Tech Shop', // Subject line
      text: `Vui lòng Click vào link dưới để xác thực email hoặc nhập OTP là : ${otp}`, // plain text body
      html: `<a href="http://localhost:8081/api/v1/auth/otp_register/${otp}" style="
      text-decoration: none;
      padding: 12px;
      color: WHITE;
      background-color: #6af86a;
      text-align: center;
      margin: 0 auto;
      width: 40%;
      display: block;
      border-radius: 5px;
      font-size: 0.9rem;
  ">Click vào đây để xác thực </a>`, // html body
    });
  }
  async createNewCustomer(data: CreateNewCustomer) {
    let {
      address,
      email,
      first_name,
      gender: gender_IsMale,
      last_name,
      password,
      phone_number,
      user_name,
    } = data;
    this.checkIsValidRegisterCustomerData(data);
    let hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.HASH_ROUND),
    );
    let user = await this.prismaService.user.create({
      data: {
        email,
        login_name: user_name,
        login_password: hashedPassword,
        phone_number: phone_number,
        address,
        gender: gender_IsMale,
        last_name,
        first_name,
        is_deleted: false,
      },
      select: {
        user_id: true,
        first_name: true,
        avartar: true,
      },
    });
    await this.checkEmailBeforeRegisterUser(email);
    return {
      value: {
        user_id: user.user_id,
        first_name: user.first_name,
        status: 'UnAuthenticated',
        message: 'Please open your email and authentic your account',
      },
    };
  }
  async ChangePassword(newPassword: string, user_id: number) {
    if (newPassword.length < 6)
      throw new BadRequestException('new password is too short');
    const user = await this.prismaService.user.findFirst({
      where: {
        user_id: user_id,
        is_deleted: false,
        is_auth: true,
      },
      select: {
        user_id: true,
      },
    });
    if (!user) throw new NotFoundException('user not found');
    let hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.HASH_ROUND),
    );
    await this.prismaService.user.update({
      where: {
        user_id: user_id,
      },
      data: {
        login_password: hashedPassword,
      },
    });
    return {
      user_id: user_id,
    };
  }

  async GetOTPtoForgotPassword(email: string) {
    const res = await this.prismaService.user.findFirst({
      where: {
        email: email,
        is_auth: true,
        is_deleted: false,
      },
      select: {
        email: true,
        login_name: true,
      },
    });
    if (!res) throw new NotFoundException('user not found');
    const otp_code_type_reset_password = 2;
    const { code: otp } = await this.createOTP(
      otp_code_type_reset_password,
      email,
    );
    await this.mailerService.sendMail({
      from: 'this.mailer_name', // sender address
      to: email, // list of receivers
      subject: 'Quên mật khẩu cho tài khoản ' + res.login_name || 'user', // Subject line
      text: `Vui lòng nhập OTP là : ${otp}`, // plain text body
      html: `Mã OTP cho việc quên mật khẩu của bạn là :${otp}`, // html body
    });
    return {
      success: true,
    };
  }
  async GetForgotPasswordLink(email: string) {
    const res = await this.prismaService.user.findFirst({
      where: {
        email: email,
        is_auth: true,
        is_deleted: false,
      },
      select: {
        email: true,
        login_name: true,
        user_id: true,
      },
    });
    if (!res) throw new NotFoundException('user not found');
    const access_token = await this.jwtService.signAsync({
      user_id: res.user_id,
      role: customerRole,
    });
    const makeChangePasswordLink = (access_token: string, email: string) =>
      `http://localhost:3000/auth/resetpassword?access_token=${encodeURI(
        access_token,
      )}&email=${encodeURI(email)}`;
    await this.mailerService.sendMail({
      from: 'this.mailer_name', // sender address
      to: email, // list of receivers
      subject: 'Quên mật khẩu cho tài khoản ' + res.login_name || 'user', // Subject line
      text: `Vui lòng click vào link dưới để thay đổi mật khẩu`, // plain text body
      html: `<a href="${makeChangePasswordLink(access_token, email)}" style="
      text-decoration: none;
      padding: 12px;
      color: WHITE;
      background-color: #6af86a;
      text-align: center;
      margin: 0 auto;
      width: 40%;
      display: block;
      border-radius: 5px;
      font-size: 0.9rem;
  ">Click vào đây để thay đổi mật khẩu </a>`, // html body
    });
    return {
      success: true,
    };
  }
}
