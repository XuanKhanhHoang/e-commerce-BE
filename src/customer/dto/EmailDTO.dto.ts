import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
