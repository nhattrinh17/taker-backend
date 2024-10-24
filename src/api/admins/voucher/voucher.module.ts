import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerVoucher, Voucher } from '@entities/index';
import { VoucherAdminRepository } from 'src/database/repository/voucher.repository';
import { CustomerVoucherAdminRepository } from 'src/database/repository/customerVoucher.repository';
import { CustomerModule } from '@admins/customer/customer.module';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, CustomerVoucher]), CustomerModule],
  controllers: [VoucherController],
  providers: [
    VoucherService,
    {
      provide: 'VoucherAdminRepositoryInterface',
      useClass: VoucherAdminRepository, // replace with your custom repository
    },
    {
      provide: 'CustomerVoucherAdminRepositoryInterface',
      useClass: CustomerVoucherAdminRepository, // replace with your custom repository
    },
  ],
})
export class VoucherModule {}
