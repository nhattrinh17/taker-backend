import { IsNumber, IsOptional, IsString } from 'class-validator';

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
  typeDiscount: string;

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
}
