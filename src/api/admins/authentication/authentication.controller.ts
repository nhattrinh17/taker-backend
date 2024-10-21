import { Controller, HttpCode, HttpStatus, Post, Version, Body, Get, UseGuards } from '@nestjs/common';
import { AdminsAuthGuard, CurrentUser, ValidationPipe } from '@common/index';
import { AuthenticationService } from './authentication.service';

import { LoginDto } from './dto';

@Controller()
export class AuthenticationController {
  constructor(private readonly service: AuthenticationService) {}

  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body(ValidationPipe) body: LoginDto) {
    return this.service.login(body);
  }

  @Version('1')
  @UseGuards(AdminsAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('userInfo')
  async userInfo(@CurrentUser() user) {
    return this.service.validateUser(user);
  }
}
