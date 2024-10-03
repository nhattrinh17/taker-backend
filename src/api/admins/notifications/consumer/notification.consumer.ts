import { NOTIFICATIONS_SCREEN } from '@common/constants/notifications.constant';
import {
  NotificationTypeEnum,
  SystemNotificationRecipientEnum,
} from '@common/enums/notification.enum';
import { FirebaseService } from '@common/services/firebase.service';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Shoemaker } from '@entities/shoemaker.entity';
import { SystemNotification } from '@entities/system-notification.entity';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { QUEUE_NAME } from '../constants';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Processor(QUEUE_NAME)
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    @InjectRepository(Notification)
    private repository: Repository<Notification>,
    @InjectRepository(SystemNotification)
    private readonly systemNotificationRepository: Repository<SystemNotification>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Shoemaker)
    private shoemakerRepository: Repository<Shoemaker>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Process('send-notification')
  async sendNotification(
    job: Job<{ notification: Notification; dto: CreateNotificationDto }>,
  ) {
    try {
      const { notification, dto } = job.data;
      this.logger.log(`Sending notification ${notification.id}`);
      // Check notification is exist
      const record = await this.systemNotificationRepository.findOneBy({
        id: notification.id,
      });
      if (!record) return;

      const batchSize = 300;

      let results: Customer[] | Shoemaker[];
      if (dto.receiver === SystemNotificationRecipientEnum.USER) {
        results = await this.customerRepository.find();
      } else {
        results = await this.shoemakerRepository.find();
      }

      for (let i = 0; i < results.length; i += batchSize) {
        const batchItems = results.slice(i, i + batchSize);
        await this.processBatch(batchItems, record);
      }

      await this.systemNotificationRepository.save({
        id: record.id,
        isSent: true,
        sentTime: new Date(),
      });

      /** END update */
      this.logger.log(
        `End send notification to parents with ${results.length} items`,
      );
    } catch (e) {
      this.logger.error(`Send notification with errors ${e.message}`);
    }
  }

  private async processBatch(
    items: Customer[] | Shoemaker[],
    record: SystemNotification,
  ) {
    try {
      const entities = [];
      const notifications = [];

      for (const item of items) {
        const obj = {
          title: record.title,
          content: record.content,
          type: NotificationTypeEnum.SYSTEM,
          systemNotificationId: record.id,
        };
        if (item instanceof Customer) {
          obj['customerId'] = item.id;
        } else {
          obj['shoemakerId'] = item.id;
        }
        entities.push(obj);
        if (item.fcmToken) {
          notifications.push({
            token: item.fcmToken,
            title: 'TAKER',
            body: record.title,
            data: { screen: NOTIFICATIONS_SCREEN.DETAIL_NOTIFICATION, obj },
          });
        }
      }
      if (notifications.length > 0) {
        this.firebaseService.sends(notifications).catch((e) => {
          this.logger.error('ADMIN SEND NOTIFICATION ERROR', e?.message);
        });
      }
      if (entities.length > 0) await this.repository.save(entities);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
