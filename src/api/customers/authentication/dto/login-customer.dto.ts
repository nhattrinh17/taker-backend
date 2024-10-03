import { IsString } from 'class-validator';
import { IsPhoneInVn } from '@common/index';

export class LoginCustomerDto {
  @IsPhoneInVn({ message: 'Invalid phone number' })
  @IsString()
  phone: string;

  @IsString()
  password: string;
}
