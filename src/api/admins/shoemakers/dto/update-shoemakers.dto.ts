import { ShoemakerStatusEnum } from '@common/enums/status.enum';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateInformationDto {
  @IsOptional()
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
  @IsEnum(ShoemakerStatusEnum)
  status: ShoemakerStatusEnum;
}
