import { TransactionStatus } from '@common/enums/transaction.enum';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class SearchWithdrawalsDto {
  @IsInt()
  @Transform(({ value }) => Number(value))
  take: number;

  @IsInt()
  @Type(() => Number)
  skip: number;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsString()
  keyword: string;
}

export class CountWithdrawalsDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsString()
  keyword: string;
}
