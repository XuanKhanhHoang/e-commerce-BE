import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ValidPhoneNumber } from '../decorators/ValidPhoneNumber.decorator';
import { ValidCustomerAddress } from '../decorators/ValidCustomerAddress.decorator';

export class CreateNewCustomer {
  @IsNotEmpty()
  user_name: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @ValidPhoneNumber()
  phone_number: string;

  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  @ValidCustomerAddress()
  address: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return Boolean(value);
  })
  @IsBoolean()
  gender: boolean;
}
