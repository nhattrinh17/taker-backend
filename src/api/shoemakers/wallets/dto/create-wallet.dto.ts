import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @Min(5000)
  @IsNumber()
  @Type(() => Number)
  amount: number;
}

export class WithdrawDto {
  @Min(50000)
  @IsNumber()
  @Type(() => Number)
  amount: number;
}
