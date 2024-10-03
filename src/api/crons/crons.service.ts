import { QUEUE_NAMES } from '@common/constants/app.constant';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';

@Injectable()
export class CronsService {
  constructor(@InjectQueue(QUEUE_NAMES.CRONS) private cronsQueue: Queue) {}

  // Send notification to customers every day at 7AM
  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'customers-daily-notifications',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  handleCustomersDailyNotifications() {
    this.cronsQueue.add(
      'customers-daily-notifications',
      {},
      { removeOnComplete: true },
    );
  }

  // Send notification to customer each two days at 10AM
  @Cron('0 10 */2 * *', {
    name: 'customers-each-two-days-notifications',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  handleCustomersEachTwoDaysNotifications() {
    this.cronsQueue.add(
      'customers-daily-notifications',
      {},
      { removeOnComplete: true },
    );
  }

  // Send notification to customer each three days at 8PM
  @Cron('0 20 */3 * *', {
    name: 'customers-each-three-days-notifications',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  handleCustomersEachThreeDaysNotifications() {
    this.cronsQueue.add(
      'customers-each-three-days-notifications',
      {},
      { removeOnComplete: true },
    );
  }

  // Send notification to shoemaker every day at 8AM
  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: 'shoemakers-daily-notifications',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  handleShoemakersDailyNotifications() {
    this.cronsQueue.add(
      'shoemakers-daily-notifications',
      {},
      { removeOnComplete: true },
    );
  }
}
