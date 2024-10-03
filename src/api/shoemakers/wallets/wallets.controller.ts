import { IShoemaker } from '@common/constants/app.constant';
import { CurrentUser } from '@common/decorators';
import { ClientIp as Ip } from '@common/decorators/client-ip.decorator';
import { ShoemakersAuthGuard } from '@common/guards';
import { ValidationPipe } from '@common/pipes';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { DepositDto, WithdrawDto } from './dto/create-wallet.dto';
import { TransactionListDto } from './dto/transaction-list.dto';
import { WalletsService } from './wallets.service';

@UseGuards(ShoemakersAuthGuard)
@Controller()
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @Version('1')
  async deposit(
    @CurrentUser() user: IShoemaker,
    @Body(ValidationPipe) dto: DepositDto,
    @Ip() ip: string,
  ) {
    return this.service.deposit(user, dto, ip);
  }

  @Get('transactions')
  @Version('1')
  async transactions(
    @CurrentUser() { sub }: IShoemaker,
    @Query(ValidationPipe) dto: TransactionListDto,
  ) {
    return this.service.getTransactions(sub, dto);
  }

  @Get('balance')
  @Version('1')
  async balance(@CurrentUser() { sub }: IShoemaker) {
    return this.service.getBalance(sub);
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  @Version('1')
  async withdraw(
    @CurrentUser() user: IShoemaker,
    @Body(ValidationPipe) dto: WithdrawDto,
  ) {
    return this.service.requestWithdrawal(user, dto);
  }
}
