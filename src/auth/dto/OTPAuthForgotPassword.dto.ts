import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { ValidOTP } from '../decorators/ValidOTP.decorator';

export class OTPAuthForgotPassword {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @ValidOTP()
  otp: number;
}
