import { AdminsAuthGuard } from '@common/guards/admins.guard';
import { ValidationPipe } from '@common/pipes/validation.pipe';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  CountWithdrawalsDto,
  SearchWithdrawalsDto,
} from './dto/search-withdrawals.dto';
import { UpdateWithdrawalsDto } from './dto/update-withdrawals.dto';
import { WithdrawalsService } from './withdrawals.service';

@UseGuards(AdminsAuthGuard)
@Controller()
export class WithdrawalsController {
  constructor(private readonly service: WithdrawalsService) {}

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('list')
  list(@Query(ValidationPipe) filter: SearchWithdrawalsDto) {
    return this.service.findList(filter);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('countRecords')
  countRecords(@Query(ValidationPipe) filter: CountWithdrawalsDto) {
    return this.service.countRecords(filter);
  }

  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) data: UpdateWithdrawalsDto,
  ) {
    return this.service.updateStatus(id, data);
  }
}
