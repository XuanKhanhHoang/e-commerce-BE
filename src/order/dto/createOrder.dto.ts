import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class createOrderDTO {
  @IsArray()
  data: orderDTO[];

  @IsOptional()
  payment_method_id: number;

  @IsOptional()
  recipient_name: number;

  @IsOptional()
  phone_number: number;

  @IsOptional()
  address: number;
}
export class orderDTO {
  @IsNumber()
  @IsNotEmpty()
  option_id: number;
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
