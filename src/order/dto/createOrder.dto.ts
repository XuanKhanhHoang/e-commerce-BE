import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ValidCustomerAddress } from 'src/customer/decorators/ValidCustomerAddress.decorator';
import { ValidPhoneNumber } from 'src/customer/decorators/ValidPhoneNumber.decorator';

export class createOrderDTO {
  @IsArray()
  data: orderDTO[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    return Number(value);
  })
  payment_method_id: number;

  @IsNotEmpty()
  recipient_name: string;

  @IsOptional()
  @ValidPhoneNumber()
  phone_number: string;

  @IsOptional()
  @ValidCustomerAddress()
  address: string;
}
export class orderDTO {
  @IsNumber()
  @IsNotEmpty()
  option_id: number;
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
