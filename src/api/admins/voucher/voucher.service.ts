import { Inject, Injectable } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherAdminRepositoryInterface } from './interface/voucher.interface';
import { messageResponseError } from '@common/constant';
import { PaginationDto } from '@common/decorators';

@Injectable()
export class VoucherService {
  constructor(
    @Inject('VoucherAdminRepositoryInterface')
    private readonly voucherAdminRepository: VoucherAdminRepositoryInterface,
  ) {}

  async create(dto: CreateVoucherDto) {
    if (dto.discount <= 0) throw Error(messageResponseError.voucher.discountThan0);
    const checkExits = await this.voucherAdminRepository.count({ code: dto.code });
    if (checkExits) throw new Error(messageResponseError.voucher.voucherAlreadyExits);
    return this.voucherAdminRepository.create(dto);
  }

  findAll(search: string, searchField: string, pagination: PaginationDto, sort: string, typeSort: string) {
    const condition: any = {};
    if (search) {
      condition[searchField || 'name'] = search;
    }
    if (searchField)
      return this.voucherAdminRepository.findAll(condition, {
        ...pagination,
        sort,
        typeSort,
      });
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} voucher`;
  // }

  async update(id: string, dto: UpdateVoucherDto) {
    const voucherById = await this.voucherAdminRepository.findOneById(id);
    if (!voucherById) throw new Error(messageResponseError.voucher.voucherNotFound);
    if (dto.discount <= 0) throw Error(messageResponseError.voucher.discountThan0);
    return this.voucherAdminRepository.findByIdAndUpdate(id, dto);
  }

  remove(id: string) {
    return `This action removes a #${id} voucher`;
  }
}
