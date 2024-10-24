import { Inject, Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerRepositoryInterface } from 'src/database/interface/customer.interface';

@Injectable()
export class CustomerAdminService {
  constructor(
    @Inject('CustomerRepositoryInterface')
    private readonly customerRepository: CustomerRepositoryInterface,
  ) {}

  getIdAllCustomer() {
    return this.customerRepository.getIdAllCustomer();
  }
}
