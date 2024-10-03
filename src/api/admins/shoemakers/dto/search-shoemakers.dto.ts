import { ShoemakerStatusEnum } from '@common/enums/status.enum';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class SearchShoemakerDto {
  @IsInt()
  @Transform(({ value }) => Number(value))
  take: number;

  @IsInt()
  @Type(() => Number)
  skip: number;

  @IsOptional()
  @IsEnum(ShoemakerStatusEnum)
  status: ShoemakerStatusEnum;

  @IsDate()
  @Type(() => Date)
  start: Date;

  @IsDate()
  @Type(() => Date)
  end: Date;

  @IsOptional()
  @IsString()
  keyword: string;
}

export class CountShoemakerDto {
  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsEnum(ShoemakerStatusEnum)
  status: ShoemakerStatusEnum;
}
