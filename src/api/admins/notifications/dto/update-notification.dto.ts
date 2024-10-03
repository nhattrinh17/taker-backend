import { SystemNotificationRecipientEnum } from '@common/enums/notification.enum';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(SystemNotificationRecipientEnum)
  receiver: SystemNotificationRecipientEnum;

  @IsBoolean()
  @Transform(({ value }) => value === true)
  isSentNow: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  dateTime: number;
}
