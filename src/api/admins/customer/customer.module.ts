import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@entities/index';
import { CustomerRepository } from 'src/database/repository/customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  // controllers: [CustomerController],
  providers: [
    CustomerService,
    {
      provide: 'CustomerRepositoryInterface',
      useClass: CustomerRepository,
    },
  ],
})
export class CustomerModule {}
