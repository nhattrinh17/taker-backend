import { CurrentUser, IShoemaker, ShoemakersAuthGuard, ValidationPipe } from '@common/index';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, Version } from '@nestjs/common';

import { FcmTokenDto, MyIncomeDto, ReferralDto, UpdateProfileDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@UseGuards(ShoemakersAuthGuard)
@Controller()
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get()
  get(@CurrentUser() { sub }: IShoemaker) {
    return this.service.getProfile(sub);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('set-fcm-token')
  setFcmToken(@CurrentUser() { sub }: IShoemaker, @Body(ValidationPipe) dto: FcmTokenDto) {
    return this.service.setFcmToken(sub, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('set-on-off')
  setOn(@CurrentUser() { sub }: IShoemaker) {
    return this.service.setOn(sub);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('get-signed-url')
  getSignedUrl(@Query('fileName') key: string) {
    return this.service.getSignedFileUrl(key);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('referral')
  getReferral(@CurrentUser() { sub }: IShoemaker, @Query(ValidationPipe) dto: ReferralDto) {
    return this.service.getReferral(sub, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('online-status')
  getOnlineStatus(@CurrentUser() { sub }: IShoemaker) {
    return this.service.getOnlineStatus(sub);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('my-income')
  getIncome(@CurrentUser() { sub }: IShoemaker, @Query(ValidationPipe) { period, end, start }: MyIncomeDto) {
    return this.service.getMyIncome(sub, period, start, end);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) userId: string, @Body(ValidationPipe) dto: UpdateProfileDto) {
    return this.service.update(userId, dto);
  }
}
