import { Inject, Injectable } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { messageResponseError } from '@common/constant';
import { PaginationDto } from '@common/decorators';
import { VoucherAdminRepositoryInterface } from 'src/database/interface/voucher.interface';
import { CustomerVoucherAdminRepositoryInterface } from 'src/database/interface/customerVoucher.interface';

@Injectable()
export class VoucherService {
  constructor(
    @Inject('VoucherAdminRepositoryInterface')
    private readonly voucherAdminRepository: VoucherAdminRepositoryInterface,
    @Inject('CustomerVoucherAdminRepositoryInterface')
    private readonly customerVoucherAdminRepository: CustomerVoucherAdminRepositoryInterface,
  ) {}

  async addAllVoucherForAllCustomer(voucherId: string) {}

  async create(dto: CreateVoucherDto) {
    if (dto.discount <= 0) throw Error(messageResponseError.voucher.discountThan0);
    const checkExits = await this.voucherAdminRepository.count({ code: dto.code });
    if (checkExits) throw new Error(messageResponseError.voucher.voucherAlreadyExits);
    if (dto.isGlobal) return this.voucherAdminRepository.create({ ...dto, type: 'shoe' });
  }

  findAll(search: string, searchField: string, pagination: PaginationDto, sort: string, typeSort: string) {
    const condition: any = {};
    if (search) {
      condition[searchField || 'name'] = search;
    }
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
