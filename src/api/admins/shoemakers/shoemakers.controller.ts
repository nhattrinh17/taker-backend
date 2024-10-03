import { AdminsAuthGuard } from '@common/guards/admins.guard';
import { ValidationPipe } from '@common/pipes/validation.pipe';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  CountShoemakerDto,
  SearchShoemakerDto,
} from './dto/search-shoemakers.dto';
import { UpdateInformationDto } from './dto/update-shoemakers.dto';
import { ShoemakersService } from './shoemakers.service';

@UseGuards(AdminsAuthGuard)
@Controller()
export class ShoemakersController {
  constructor(private readonly service: ShoemakersService) {}

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('list')
  list(@Query(ValidationPipe) filter: SearchShoemakerDto) {
    return this.service.findList(filter);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('countRecords')
  countRecords(@Query(ValidationPipe) filter: CountShoemakerDto) {
    return this.service.countRecords(filter);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get(':id')
  show(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.show(id);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(ValidationPipe) data: UpdateInformationDto,
  ) {
    return this.service.update(id, data);
  }
}
