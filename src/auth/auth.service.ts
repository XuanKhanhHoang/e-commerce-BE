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
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async GetInfoByAccessToken(token: string): Promise<userGeneral> {
    try {
      const {
        user_id: userId,
        role,
      }: {
        user_id: number;
        role: string;
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
    let { user_id, user } = await this.prismaService.user_facebook.findFirst({
      where: {
        facebookId: fb_id,
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
}
