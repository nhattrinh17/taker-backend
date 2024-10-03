import { IsString } from 'class-validator';
import { IsPhoneInVn } from '@common/index';

export class LoginShoemakerDto {
  @IsPhoneInVn({ message: 'Invalid phone number' })
  @IsString()
  phone: string;

  @IsString()
  password: string;
}
