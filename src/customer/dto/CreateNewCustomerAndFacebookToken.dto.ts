import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateNewCustomerAndFacebookToken {
  @IsNotEmpty()
  access_token: string;

  @IsNotEmpty()
  user_name: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  phone_number: string;

  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Boolean(value);
  })
  @IsBoolean()
  gender: boolean;
}
