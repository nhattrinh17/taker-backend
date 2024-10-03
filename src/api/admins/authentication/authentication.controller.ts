import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Version,
  Body,
} from '@nestjs/common';
import { ValidationPipe } from '@common/index';
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
}
