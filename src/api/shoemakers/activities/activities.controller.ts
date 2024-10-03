import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  CurrentUser,
  ShoemakersAuthGuard,
  IShoemaker,
  ValidationPipe,
} from '@common/index';

import { ActivitiesService } from './activities.service';
import { ActivityDto } from './dto/activity.dto';

@UseGuards(ShoemakersAuthGuard)
@Controller()
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('in-progress')
  inProgress(@CurrentUser() { sub }: IShoemaker) {
    return this.service.inProgress(sub);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Get('histories')
  histories(
    @CurrentUser() { sub }: IShoemaker,
    @Query(ValidationPipe) dto: ActivityDto,
  ) {
    return this.service.histories(sub, dto);
  }
}
