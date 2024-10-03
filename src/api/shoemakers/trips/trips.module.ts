import {
  Customer,
  Notification,
  Shoemaker,
  Transaction,
  Trip,
  Wallet,
} from '@entities/index';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QUEUE_NAMES } from '@common/constants/app.constant';
import { FirebaseService } from '@common/services/firebase.service';
import { TripsConsumer } from './consumer/trips.consumer';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip,
      Shoemaker,
      Notification,
      Wallet,
      Transaction,
      Customer,
    ]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.NOTIFICATION,
    }),
  ],
  controllers: [TripsController],
  providers: [TripsService, FirebaseService, TripsConsumer],
})
export class TripsModule {}
