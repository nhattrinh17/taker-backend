import { QUEUE_NAMES } from '@common/constants/app.constant';
import { FirebaseService } from '@common/services/firebase.service';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Shoemaker } from '@entities/shoemaker.entity';
import { TransactionLog } from '@entities/transaction-log.entity';
import { Transaction } from '@entities/transaction.entity';
import { Trip } from '@entities/trip.entity';
import { Wallet } from '@entities/wallet.entity';
import { BullModule } from '@nestjs/bull';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionLogListener } from './listeners/log.listenter';
import { WhitelistMiddleware } from './middlware/whitelist-middleware';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Wallet,
      TransactionLog,
      Trip,
      Customer,
      Notification,
      Shoemaker,
    ]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.CUSTOMERS_TRIP,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, TransactionLogListener, FirebaseService],
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WhitelistMiddleware)
      .exclude({
        version: '1',
        path: 'payment/returnUrl',
        method: RequestMethod.GET,
      })
      .forRoutes(PaymentController);
  }
}
