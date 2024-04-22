import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  isEmail,
} from 'class-validator';

export class updateUserDetailDTO {
  @IsOptional()
  @IsNotEmpty()
  user_name: string;
  @IsOptional()
  @IsNotEmpty()
  last_name: string;
  @IsOptional()
  @IsNotEmpty()
  first_name: string;
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  @IsBoolean()
  gender: boolean;
  @IsNotEmpty()
  @IsOptional()
  @IsEmail()
  email: string;
  @IsOptional()
  @IsNotEmpty()
  phone_number: string;
  @IsOptional()
  @IsNotEmpty()
  address: string;
}
