import {
  NOTIFICATIONS_SCREEN,
  SHOEMAKER,
} from '@common/constants/notifications.constant';
import { QUEUE_NAMES } from '@common/index';
import { FirebaseService } from '@common/services/firebase.service';
import { Notification, Shoemaker } from '@entities/index';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';

@Processor(QUEUE_NAMES.WORK_STATUS)
export class WorkStatusConsumer {
  private readonly logger = new Logger(WorkStatusConsumer.name);

  constructor(
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @Process('work-status')
  async handleUpdateStatus(job: Job<unknown>) {
    try {
      const { userId } = job.data as {
        userId: string;
      };
      const shoemaker = await this.shoemakerRepository.findOneBy({
        id: userId,
      });
      if (!shoemaker) return;
      if (shoemaker.isOn) return;
      const randomIndex = Math.floor(
        Math.random() * SHOEMAKER.WORK_STATUS.length,
      );
      const randomContent = SHOEMAKER.WORK_STATUS[randomIndex];
      await this.notificationRepository.save({
        shoemakerId: userId,
        title: 'TAKER',
        content: randomContent,
        data: JSON.stringify({
          screen: NOTIFICATIONS_SCREEN.HOME,
        }),
      });

      if (shoemaker.fcmToken) {
        this.firebaseService.send({
          token: shoemaker.fcmToken,
          title: 'TAKER',
          body: randomContent,
          data: { screen: NOTIFICATIONS_SCREEN.HOME },
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
