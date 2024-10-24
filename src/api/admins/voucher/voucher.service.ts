import { Inject, Injectable } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { messageResponseError } from '@common/constant';
import { PaginationDto } from '@common/decorators';
import { VoucherAdminRepositoryInterface } from 'src/database/interface/voucher.interface';
import { CustomerVoucherAdminRepositoryInterface } from 'src/database/interface/customerVoucher.interface';
import { CustomerAdminService } from '@admins/customer/customer.service';

@Injectable()
export class VoucherService {
  constructor(
    @Inject('VoucherAdminRepositoryInterface')
    private readonly voucherAdminRepository: VoucherAdminRepositoryInterface,
    @Inject('CustomerVoucherAdminRepositoryInterface')
    private readonly customerVoucherAdminRepository: CustomerVoucherAdminRepositoryInterface,
    private readonly customerAdminService: CustomerAdminService,
  ) {}

  async addAllVoucherForAllCustomer(voucherId: string) {
    const arrCustomer = await this.customerAdminService.getIdAllCustomer();
    const dataDto = arrCustomer.map((i) => {
      return { customerId: i.id, voucherId };
    });
    return this.customerVoucherAdminRepository.insertManyVoucherForCustomer(dataDto);
  }

  async create(dto: CreateVoucherDto) {
    if (dto.discount <= 0) throw Error(messageResponseError.voucher.discountThan0);
    const checkExits = await this.voucherAdminRepository.count({ code: dto.code });
    if (checkExits) throw new Error(messageResponseError.voucher.voucherAlreadyExits);
    const voucher = await this.voucherAdminRepository.create({ ...dto, type: 'shoe' });
    if (dto.isGlobal) this.addAllVoucherForAllCustomer(voucher.id);
    return voucher;
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

  async findOneAndDataCustomer(id: string, pagination: PaginationDto) {
    const voucherById = await this.voucherAdminRepository.findOneById(id);
    if (!voucherById) throw new Error(messageResponseError.voucher.voucherNotFound);
    const customerVoucher = await this.customerVoucherAdminRepository.findAllAndJoin({ voucherId: id }, pagination);
    return {
      voucher: voucherById,
      ...customerVoucher,
    };
  }

  async update(id: string, dto: UpdateVoucherDto) {
    const voucherById = await this.voucherAdminRepository.findOneById(id);
    if (!voucherById) throw new Error(messageResponseError.voucher.voucherNotFound);
    if (dto.discount <= 0) throw Error(messageResponseError.voucher.discountThan0);
    if (voucherById.isGlobal !== dto.isGlobal) {
      if (dto.isGlobal) {
        this.addAllVoucherForAllCustomer(id);
      } else {
        this.customerVoucherAdminRepository.revokeAllVoucherById(id);
      }
    }
    return this.voucherAdminRepository.findByIdAndUpdate(id, dto);
  }

  async remove(id: string) {
    const voucherById = await this.voucherAdminRepository.findOneById(id);
    if (!voucherById) throw new Error(messageResponseError.voucher.voucherNotFound);
    const checkUseVoucher = await this.customerVoucherAdminRepository.count({
      voucherId: id,
      timeUse: { $ne: null },
    });
    if (checkUseVoucher) throw Error(messageResponseError.voucher.cannotDeleteBecauseUsed);
    return this.voucherAdminRepository.permanentlyDelete(id);
  }
}
