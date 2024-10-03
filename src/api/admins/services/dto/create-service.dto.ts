import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  discountPrice: number;

  @IsNumber()
  @IsOptional()
  discount: number;
}
