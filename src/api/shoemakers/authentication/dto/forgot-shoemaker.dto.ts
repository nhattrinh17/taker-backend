import { IsString } from 'class-validator';
import { IsPhoneInVn } from '@common/index';

export class ForgotShoemakerDto {
  @IsPhoneInVn({ message: 'Invalid phone number' })
  @IsString()
  phone: string;
}
