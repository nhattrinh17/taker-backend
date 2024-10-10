import { IsOptional, IsString, IsEmail, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class NewPasswordDto {
  @IsString()
  otp: string;

  @IsString()
  password: string;
}

export class UpdateInformationDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsOptional()
  @IsString()
  identityCard: string;

  @IsOptional()
  @IsString()
  placeOfOrigin: string;

  @IsOptional()
  @IsString()
  placeOfResidence: string;

  @IsOptional()
  @IsString()
  frontOfCardImage: string;

  @IsOptional()
  @IsString()
  backOfCardImage: string;

  @IsOptional()
  @IsString()
  workRegistrationArea: string;

  @IsOptional()
  @IsString()
  maritalStatus: string;

  @IsOptional()
  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  referralCode: string;

  @IsOptional()
  @IsEmail()
  email: string;
}

export class UpdateAvatarDto {
  @IsString()
  avatar: string;
}

export class UpdateFCMTokenUserDto {
  @IsString()
  userId: string;

  @IsString()
  fcmToken: string;
}
