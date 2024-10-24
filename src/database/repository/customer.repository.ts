import { Customer } from '@entities/index';
import { Injectable } from '@nestjs/common';
import { BaseRepositoryAbstract } from 'src/base';
import { CustomerRepositoryInterface } from '../interface/customer.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CustomerRepository extends BaseRepositoryAbstract<Customer> implements CustomerRepositoryInterface {
  constructor(@InjectRepository(Customer) private readonly customerRepository: Repository<Customer>) {
    super(customerRepository);
  }

  getIdAllCustomer(): Promise<Customer[]> {
    return this.customerRepository.find({
      select: ['id'],
      where: {
        isVerified: true,
      },
    });
  }
}
