import { QUEUE_NAMES } from '@common/constants/app.constant';
import { FirebaseService } from '@common/services';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Wallet } from '@entities/wallet.entity';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersConsumer } from './consumer/customers.consumer';
import { CronsService } from './crons.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.CRONS }),
    TypeOrmModule.forFeature([Customer, Notification, Wallet]),
  ],
  providers: [CronsService, FirebaseService, CustomersConsumer],
})
export class CronsModule {}
