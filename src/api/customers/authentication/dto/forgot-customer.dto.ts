import { IsString } from 'class-validator';
import { IsPhoneInVn } from '@common/index';

export class ForgotCustomerDto {
  @IsPhoneInVn({ message: 'Invalid phone number' })
  @IsString()
  phone: string;
}
