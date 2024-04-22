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

@Injectable()
export class CustomerService {
  constructor(
    private prismaService: PrismaService,
    private googleDriveService: GoogleDriveService,
    private jwtService: JwtService,
    private readonly facebookService: FacebookAuthService,
  ) {}
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
  async getCustomerDetail(customerId: number): Promise<UserFullDetail> {
    let customer = await this.prismaService.user.findUnique({
      where: {
        user_id: customerId,
        is_deleted: false,
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
      avatar = 'user' + user_id + '_avatar';
      avatar = await this.googleDriveService.uploadFile(file, avatar);
      if (!avatar) {
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
        email:
          new_user_detail.email != undefined
            ? new_user_detail.email
            : user.email,
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
  async createNewCustomer(data: CreateNewCustomer, file: Express.Multer.File) {
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
    let avatar;
    if (file != undefined) {
      avatar = 'user' + user_name + '_avatar';
      avatar = await this.googleDriveService.uploadFile(file, avatar);
      if (!avatar) {
        throw new InternalServerErrorException('Upload avatar image error');
      }
    }
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
        avartar: avatar,
        is_deleted: false,
      },
      select: {
        user_id: true,
        first_name: true,
        avartar: true,
      },
    });
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
  async createNewCustomerAndFacebookToken(
    data: CreateNewCustomerAndFacebookToken,
    file: Express.Multer.File,
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
      access_token: fb_token,
    } = data;
    let { id } = await this.facebookService.getUser(fb_token, 'id');
    this.checkIsValidRegisterCustomerData(data);
    let hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.HASH_ROUND),
    );
    let avatar;
    if (file != undefined) {
      avatar = 'user' + user_name + '_avatar';
      avatar = await this.googleDriveService.uploadFile(file, avatar);
      if (!avatar) {
        throw new InternalServerErrorException('Upload avatar image error');
      }
    }
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
        avartar: avatar,
        is_deleted: false,
      },
      select: {
        user_id: true,
        first_name: true,
        avartar: true,
      },
    });
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
}
