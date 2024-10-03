import {
  CurrentUser,
  IShoemaker,
  ShoemakersAuthGuard,
  ValidationPipe,
} from '@common/index';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

import {
  CreateShoemakerDto,
  ForgotShoemakerDto,
  LoginShoemakerDto,
  NewPasswordDto,
  UpdateAvatarDto,
  UpdateInformationDto,
  VerifyOtpDto,
  VerifyPhoneNumberDto,
} from './dto';

@Controller()
export class AuthenticationController {
  constructor(private readonly service: AuthenticationService) {}

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('verify-phone-number')
  verifyPhoneNumber(@Body(ValidationPipe) dto: VerifyPhoneNumberDto) {
    return this.service.verifyPhoneNumber(dto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Version('1')
  @Post()
  createAccount(@Body(ValidationPipe) dto: CreateShoemakerDto) {
    return this.service.createAccount(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('verify-otp')
  verifyOtp(@Body(ValidationPipe) dto: VerifyOtpDto) {
    return this.service.verifyOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('login')
  login(@Body(ValidationPipe) dto: LoginShoemakerDto) {
    return this.service.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('forgot-password')
  forgotPassword(@Body(ValidationPipe) dto: ForgotShoemakerDto) {
    return this.service.forgotPassword(dto);
  }

  @UseGuards(ShoemakersAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('logout')
  logout(@CurrentUser() { sub }: IShoemaker) {
    return this.service.logout(sub);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('send-sms')
  sendSms(@Body(ValidationPipe) dto: ForgotShoemakerDto) {
    return this.service.sendSms(dto.phone);
  }

  @UseGuards(ShoemakersAuthGuard)
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  destroy(@Param('id', ParseUUIDPipe) userId: string) {
    return this.service.destroy(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post(':id/new-password')
  newPassword(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body(ValidationPipe) dto: NewPasswordDto,
  ) {
    return this.service.newPassword(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post(':id/update-information')
  updateInformation(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body(ValidationPipe) dto: UpdateInformationDto,
  ) {
    return this.service.updateInformation(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post(':id/update-avatar')
  updateAvatar(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body(ValidationPipe) dto: UpdateAvatarDto,
  ) {
    return this.service.updateAvatar(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get(':id/get-signed-url')
  getSignedUrl(
    @Query('fileName') key: string,
    @Param('id', ParseUUIDPipe) userId: string,
  ) {
    return this.service.getSignedFileUrl(userId, key);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get(':id/get-status')
  getStatus(@Param('id', ParseUUIDPipe) userId: string) {
    return this.service.getStatus(userId);
  }
}
