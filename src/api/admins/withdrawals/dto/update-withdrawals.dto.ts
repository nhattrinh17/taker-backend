import { IsString } from 'class-validator';

export class UpdateWithdrawalsDto {
  @IsString()
  evidence: string;
}
