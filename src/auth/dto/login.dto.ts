import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserLoginDTO {
  @IsNotEmpty()
  login_name: string;

  @IsNotEmpty()
  password: string;
}

export type userGeneral = {
  user_id: number;
  first_name: string;
  avatar: string | undefined;
  ROLE: string;
};
