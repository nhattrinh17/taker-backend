import {
  CurrentUser,
  IShoemaker,
  ShoemakersAuthGuard,
  ValidationPipe,
} from '@common/index';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripsService } from './trips.service';

@UseGuards(ShoemakersAuthGuard)
@Controller()
export class TripsController {
  constructor(private readonly service: TripsService) {}

  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Post('update-status')
  async updateTripStatus(
    @CurrentUser() { sub }: IShoemaker,
    @Body(ValidationPipe) dto: UpdateTripDto,
  ) {
    return this.service.updateTripStatus(sub, dto);
  }

  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async show(
    @CurrentUser() { sub }: IShoemaker,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.show(sub, id);
  }
}
