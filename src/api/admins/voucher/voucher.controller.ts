import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe, UseGuards, Version, HttpException, HttpStatus } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto, QueryVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Pagination, PaginationDto } from '@common/decorators';
import { AdminsAuthGuard } from '@common/guards';

@UseGuards(AdminsAuthGuard)
@Controller('')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @Version('1')
  async create(@Body() createVoucherDto: CreateVoucherDto) {
    try {
      return await this.voucherService.create(createVoucherDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @Version('1')
  findAll(@Pagination() pagination: PaginationDto, @Query(ValidationPipe) dto: QueryVoucherDto) {
    return this.voucherService.findAll(dto.search, dto.searchField, pagination, dto.sort, dto.typeSort);
  }

  @Get(':id/customer')
  @Version('1')
  findOne(@Param('id') id: string, @Pagination() pagination: PaginationDto) {
    return this.voucherService.findOneAndDataCustomer(id, pagination);
  }

  @Patch(':id')
  @Version('1')
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.voucherService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @Version('1')
  remove(@Param('id') id: string) {
    return this.voucherService.remove(id);
  }
}
