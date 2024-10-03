import { AdminsAuthGuard } from '@common/guards/admins.guard';
import { S3Service } from '@common/services/s3.service';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';

@UseGuards(AdminsAuthGuard)
@Controller('')
export class AdminsController {
  constructor(private readonly s3: S3Service) {}

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('get-signed-url')
  getSignedUrl(@Query('fileName') key: string) {
    if (!key) {
      throw new BadRequestException('fileName is required');
    }
    return this.s3.getSignedFileUrl(key);
  }
}
