import { VoucherTypeEnum } from '@common/enums/voucher.enum';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  code: string;

  @IsString()
  paymentMethod: string;

  @IsNumber()
  discount: number;

  @IsString()
  typeDiscount: VoucherTypeEnum;

  @IsNumber()
  discountToUp: number;

  @IsOptional()
  @IsNumber()
  minimumOrder: number;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  icon: string;

  @IsOptional()
  @IsString()
  startTime: string;

  @IsOptional()
  @IsString()
  endTime: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  isGlobal: boolean;
}

export class QueryVoucherDto {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  searchField: string;

  @IsOptional()
  @IsString()
  sort: string;

  @IsOptional()
  @IsString()
  typeSort: string;
}
