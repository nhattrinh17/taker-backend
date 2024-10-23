import { CustomerVoucher } from '@entities/index';
import { Injectable } from '@nestjs/common';
import { BaseRepositoryAbstract } from 'src/base';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerVoucherAdminRepositoryInterface } from '../interface/customerVoucher.interface';

@Injectable()
export class CustomerVoucherAdminRepository extends BaseRepositoryAbstract<CustomerVoucher> implements CustomerVoucherAdminRepositoryInterface {
  constructor(@InjectRepository(CustomerVoucher) private readonly customerVoucherRepository: Repository<CustomerVoucher>) {
    super(customerVoucherRepository); // Truyền repository vào abstract class
  }
}
