import { IsEnum, IsUUID, IsOptional, IsArray } from 'class-validator';
import { PartialStatusEnum } from '@common/index';

export class UpdateTripDto {
  @IsUUID()
  tripId: string;

  @IsEnum(PartialStatusEnum)
  status: PartialStatusEnum;

  @IsOptional()
  @IsArray()
  images: string[];
}
