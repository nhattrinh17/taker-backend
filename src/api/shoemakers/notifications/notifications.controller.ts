import { IShoemaker } from '@common/constants';
import { CurrentUser } from '@common/decorators';
import { ShoemakersAuthGuard } from '@common/guards/shoemaker.guard';
import { ValidationPipe } from '@common/pipes';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ListNotificationDto } from './dto/list-notification.dto';
import { NotificationService } from './notifications.service';

@UseGuards(ShoemakersAuthGuard)
@Controller()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @Version('1')
  async index(
    @CurrentUser() { sub }: IShoemaker,
    @Query(ValidationPipe) query: ListNotificationDto,
  ) {
    return this.service.index(sub, query);
  }

  @Patch(':id/mark-as-read')
  @Version('1')
  async markAsRead(
    @CurrentUser() { sub }: IShoemaker,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.markAsRead(sub, id);
  }
}
