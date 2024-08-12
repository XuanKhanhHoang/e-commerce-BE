import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  isEmail,
} from 'class-validator';
import { ValidPhoneNumber } from '../decorators/ValidPhoneNumber.decorator';
import { ValidCustomerAddress } from '../decorators/ValidCustomerAddress.decorator';

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
  @IsOptional()
  @IsNotEmpty()
  @ValidPhoneNumber()
  phone_number: string;
  @IsOptional()
  @IsNotEmpty()
  @ValidCustomerAddress()
  address: string;
}
