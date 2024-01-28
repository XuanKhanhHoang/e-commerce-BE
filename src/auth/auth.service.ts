import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserLoginDTO, userGeneral } from './dto/login.dto';
import { adminRole, customerRole } from './roles.enum';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async GetInfoByAccessToken(token: string): Promise<userGeneral> {
    // throw new BadRequestException();
    try {
      const {
        user_id: userId,
        role,
        iat,
        exp,
      }: {
        user_id: number;
        role: string;
        iat: number;
        exp: number;
      } = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      });

      if (userId != undefined && role != adminRole) {
        let user = await this.prismaService.user.findUnique({
          where: {
            is_deleted: false,
            user_id: userId,
          },
        });
        if (!user) throw new UnauthorizedException('Not found');
        return {
          user_id: user.user_id,
          first_name: user.first_name,
          avatar: user.avartar,
          ROLE: customerRole,
        };
      }
    } catch (e) {
      if (e.status == 500) throw new InternalServerErrorException();
      throw new BadRequestException('authorization failed');
    }
  }
  async Login(
    data: UserLoginDTO,
  ): Promise<{ access_token: string; value: userGeneral } | any> {
    let user = await this.prismaService.user.findFirst({
      where: {
        login_name: {
          equals: data.login_name,
        },
        is_deleted: false,
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
  async Register(): Promise<any> {
    return;
  }
  async AdminLogin() {
    // let Admin: loginInfoDto = { username: 'Admin', password: 'Khanhpopo1S' };
    // if (JSON.stringify(data) != JSON.stringify(Admin))
    //   throw new UnauthorizedException();
    // let access_token = await this.jwtService.signAsync({
    //   role: customerRole,
    // });
    // return {
    //   access_token: access_token,
    //   value: {
    //     CUSTOMER_ID: '',
    //     FIRST_NAME: '',
    //     AVATAR: '',
    //     ROLE: adminRole,
    //   },
    // };
  }
}
