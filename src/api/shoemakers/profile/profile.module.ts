import { QUEUE_NAMES, S3Service } from '@common/index';
import { Notification, Shoemaker, Trip } from '@entities/index';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FirebaseService } from '@common/services/firebase.service';
import {
  UpdateLocationConsumer,
  UpdateStatusConsumer,
  WorkStatusConsumer,
} from './consumers';
import { UpdateLocationListener, UpdateStatusListener } from './listeners';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shoemaker, Trip, Notification]),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.UPDATE_LOCATION,
      },
      { name: QUEUE_NAMES.UPDATE_STATUS },
      { name: QUEUE_NAMES.WORK_STATUS },
    ),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    S3Service,
    UpdateLocationListener,
    UpdateLocationConsumer,
    UpdateStatusListener,
    UpdateStatusConsumer,
    WorkStatusConsumer,
    FirebaseService,
  ],
})
export class ProfileModule {}
