import { QUEUE_NAMES } from '@common/constants/app.constant';
import {
  CUSTOMERS,
  NOTIFICATIONS_SCREEN,
} from '@common/constants/notifications.constant';
import { FirebaseService } from '@common/services';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Shoemaker } from '@entities/shoemaker.entity';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class TripsConsumer {
  private readonly logger = new Logger(TripsConsumer.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Shoemaker)
    private shoemakerRepository: Repository<Shoemaker>,
  ) {}

  @Process('after-trip-success-5-minutes')
  async handleAfterTripSuccess(job: Job<unknown>) {
    try {
      const { customerId } = job.data as { customerId: string };
      if (!customerId) return;
      const customer = await this.customerRepository.findOneBy({
        id: customerId,
      });
      const randomIndex = Math.floor(
        Math.random() * CUSTOMERS.TRIP_SUCCESS.length,
      );
      const randomContent = CUSTOMERS.TRIP_SUCCESS[randomIndex];
      await this.notificationRepository.save({
        customerId,
        title: 'TAKER',
        content: randomContent,
        data: JSON.stringify({
          screen: NOTIFICATIONS_SCREEN.HOME,
        }),
      });
      if (customer.fcmToken) {
        this.firebaseService.send({
          token: customer.fcmToken,
          title: 'TAKER',
          body: randomContent,
          data: { screen: NOTIFICATIONS_SCREEN.HOME },
        });
      }
    } catch (error) {
      this.logger.error('after-trip-success-5-minutes:', error);
    }
  }

  @Process('update-wallet')
  async handleUpdateWallet(job: Job<unknown>) {
    try {
      const { shoemakerId, message } = job.data as {
        shoemakerId: string;
        message: string;
      };
      if (!shoemakerId) return;
      const shoemaker = await this.shoemakerRepository.findOneBy({
        id: shoemakerId,
      });
      await this.notificationRepository.save({
        shoemakerId,
        title: 'TAKER',
        content: message,
        data: JSON.stringify({
          screen: NOTIFICATIONS_SCREEN.WALLET,
        }),
      });
      if (shoemaker.fcmToken) {
        this.firebaseService.send({
          token: shoemaker.fcmToken,
          title: 'TAKER',
          body: message,
          data: { screen: NOTIFICATIONS_SCREEN.WALLET },
        });
      }
    } catch (error) {
      this.logger.error('update-wallet:', error);
    }
  }
}
