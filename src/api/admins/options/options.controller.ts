import { AdminsAuthGuard, ValidationPipe } from '@common/index';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import { CreateOptionDto } from './dto/create-option.dto';
import { OptionService } from './options.service';

@UseGuards(AdminsAuthGuard)
@Controller('')
export class OptionController {
  constructor(private readonly service: OptionService) {}

  @Version('1')
  @Post('')
  create(@Body(new ValidationPipe()) dto: CreateOptionDto) {
    return this.service.create(dto);
  }

  @Version('1')
  @Get('')
  get() {
    return this.service.get();
  }
}
