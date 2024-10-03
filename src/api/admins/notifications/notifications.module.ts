import { FirebaseService } from '@common/services/firebase.service';
import { S3Service } from '@common/services/s3.service';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Shoemaker } from '@entities/shoemaker.entity';
import { SystemNotification } from '@entities/system-notification.entity';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAME } from './constants';
import { NotificationConsumer } from './consumer/notification.consumer';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemNotification,
      Notification,
      Customer,
      Shoemaker,
    ]),
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    NotificationConsumer,
    S3Service,
    FirebaseService,
  ],
})
export class NotificationsModule {}
