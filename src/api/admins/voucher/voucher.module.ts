import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '@entities/index';
import { VoucherAdminRepository } from './reppository/voucher.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher])],
  controllers: [VoucherController],
  providers: [
    VoucherService,
    {
      provide: 'VoucherAdminRepositoryInterface',
      useClass: VoucherAdminRepository, // replace with your custom repository
    },
  ],
})
export class VoucherModule {}
