import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto, QueryVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Pagination, PaginationDto } from '@common/decorators';
import { AdminsAuthGuard } from '@common/guards';

@Controller('')
@UseGuards(AdminsAuthGuard)
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(createVoucherDto);
  }

  @Get()
  findAll(@Pagination() pagination: PaginationDto, @Query(ValidationPipe) dto: QueryVoucherDto) {
    return this.voucherService.findAll(dto.search, dto.searchField, pagination, dto.sort, dto.typeSort);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.voucherService.findOne(+id);
  // }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.voucherService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voucherService.remove(id);
  }
}
