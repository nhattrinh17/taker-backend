import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IsPhoneInVn } from '@common/index';

export class CreateCustomerDto {
  @IsPhoneInVn({ message: 'Invalid phone number' })
  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsOptional()
  @IsString()
  referralCode: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  fullName: string;
}

export class VerifyPhoneNumberDto {
  @IsString()
  @IsPhoneInVn({ message: 'Invalid phone number' })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  otp: string;

  @IsUUID()
  userId: string;
}
