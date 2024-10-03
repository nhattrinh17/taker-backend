import {
  INotificationPayload,
  QUEUE_NAMES,
} from '@common/constants/app.constant';
import {
  CUSTOMERS,
  NOTIFICATIONS_SCREEN,
  SHOEMAKER,
} from '@common/constants/notifications.constant';
import { FirebaseService } from '@common/services';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Wallet } from '@entities/wallet.entity';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { IsNull, LessThan, Not, Repository } from 'typeorm';

@Processor(QUEUE_NAMES.CRONS)
export class CustomersConsumer {
  private readonly logger = new Logger(CustomersConsumer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.CRONS) private cronsQueue: Queue,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Process('customers-daily-notifications')
  async handleCustomersDailyNotifications() {
    try {
      this.logger.log('Start send notification to customer every day');

      const batchSize = 300;
      let offset = 0;
      let result = 0;

      while (true) {
        const customers = await this.customerRepository
          .createQueryBuilder('customer')
          .where({ fcmToken: Not(IsNull()) })
          .take(batchSize)
          .skip(offset)
          .getMany();

        if (customers.length === 0) {
          break;
        }
        result++;
        const firebaseDto = [];
        const notificationsDto = [];

        for (const customer of customers) {
          const randomIndex = Math.floor(
            Math.random() * CUSTOMERS.DAILY.length,
          );
          const randomContent = CUSTOMERS.DAILY[randomIndex];
          notificationsDto.push({
            customerId: customer.id,
            title: 'TAKER',
            content: randomContent,
            data: JSON.stringify({ screen: NOTIFICATIONS_SCREEN.REQUEST_TRIP }),
          });
          firebaseDto.push({
            token: customer.fcmToken,
            title: 'TAKER',
            body: randomContent,
            data: { screen: NOTIFICATIONS_SCREEN.REQUEST_TRIP },
          });
        }

        if (notificationsDto.length > 0) {
          await this.notificationRepository.save(notificationsDto);
        }
        if (firebaseDto.length > 0) {
          await this.sendNotification(firebaseDto);
        }
        offset += batchSize;
      }
      this.logger.log(
        `End send notification to customer every day with ${result}`,
      );
    } catch (error) {
      this.logger.error('[customers-daily-notifications]' + error?.message);
    }
  }

  @Process('customers-each-three-days-notifications')
  async handleCustomersEachThreeDaysNotifications() {
    try {
      this.logger.log('Start send notification to customer three day');

      const batchSize = 300;
      let offset = 0;
      let result = 0;

      while (true) {
        const customers = await this.customerRepository
          .createQueryBuilder('customer')
          .where({ fcmToken: Not(IsNull()) })
          .take(batchSize)
          .skip(offset)
          .getMany();

        if (customers.length === 0) {
          break;
        }
        result++;
        const firebaseDto = [];
        const notificationsDto = [];

        for (const customer of customers) {
          const randomIndex = Math.floor(
            Math.random() * CUSTOMERS.CARES.length,
          );
          const randomContent = CUSTOMERS.CARES[randomIndex];
          notificationsDto.push({
            customerId: customer.id,
            title: 'TAKER',
            content: randomContent,
            data: JSON.stringify({
              screen: NOTIFICATIONS_SCREEN.CUSTOMER_CARE,
            }),
          });
          firebaseDto.push({
            token: customer.fcmToken,
            title: 'TAKER',
            body: randomContent,
            data: { screen: NOTIFICATIONS_SCREEN.CUSTOMER_CARE },
          });
        }

        if (notificationsDto.length > 0) {
          await this.notificationRepository.save(notificationsDto);
        }
        if (firebaseDto.length > 0) {
          await this.sendNotification(firebaseDto);
        }
        offset += batchSize;
      }
      this.logger.log(
        `End send notification to customer three day with ${result}`,
      );
    } catch (error) {
      this.logger.error(
        '[customers-each-three-days-notifications]' + error?.message,
      );
    }
  }

  @Process('shoemakers-daily-notifications')
  async handleShoemakersDailyNotifications() {
    try {
      this.logger.log('Start send notification to shoemaker at 8AM every day');

      const batchSize = 300;
      let offset = 0;
      let result = 0;

      while (true) {
        const wallets = await this.walletRepository
          .createQueryBuilder('w')
          .where({ balance: LessThan(500000) })
          .innerJoinAndSelect('w.shoemaker', 'shoemaker')
          .take(batchSize)
          .skip(offset)
          .getMany();

        if (wallets.length === 0) {
          break;
        }

        result++;
        const firebaseDto = [];
        const notificationsDto = [];

        for (const wallet of wallets) {
          const randomIndex = Math.floor(
            Math.random() * SHOEMAKER.WALLET_NOT_ENOUGH.length,
          );
          const randomContent = SHOEMAKER.WALLET_NOT_ENOUGH[randomIndex];
          notificationsDto.push({
            shoemakerId: wallet.shoemaker.id,
            title: 'TAKER',
            content: randomContent,
            data: JSON.stringify({
              screen: NOTIFICATIONS_SCREEN.WALLET,
            }),
          });
          if (wallet.shoemaker.fcmToken) {
            firebaseDto.push({
              token: wallet.shoemaker.fcmToken,
              title: 'TAKER',
              body: randomContent,
              data: { screen: NOTIFICATIONS_SCREEN.WALLET },
            });
          }
        }

        if (notificationsDto.length > 0) {
          await this.notificationRepository.save(notificationsDto);
        }
        if (firebaseDto.length > 0) {
          await this.sendNotification(firebaseDto);
        }
        offset += batchSize;
      }
      this.logger.log(
        `End send notification to shoemaker at 8AM every day with ${result}`,
      );
    } catch (error) {
      this.logger.error('[shoemakers-daily-notifications]' + error?.message);
    }
  }

  async sendNotification(payloads: INotificationPayload[]) {
    try {
      await this.firebaseService.sends(payloads);
    } catch (error) {
      this.logger.error('[sendNotification]' + error?.message);
    }
  }
}
