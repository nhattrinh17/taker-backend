import { IsString } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  readonly phone: string;
}
