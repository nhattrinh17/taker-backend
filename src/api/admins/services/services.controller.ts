import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { AdminsAuthGuard, ValidationPipe } from '@common/index';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto';

@UseGuards(AdminsAuthGuard)
@Controller()
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Version('1')
  @Post('')
  create(@Body(new ValidationPipe()) dto: CreateServiceDto) {
    return this.service.create(dto);
  }
}
