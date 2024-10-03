import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QUEUE_NAMES } from '@common/index';

import { Shoemaker } from '@entities/index';

@Processor(QUEUE_NAMES.UPDATE_STATUS)
export class UpdateStatusConsumer {
  private readonly logger = new Logger(UpdateStatusConsumer.name);

  constructor(
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
  ) {}

  @Process('shoemaker-update-status')
  async handleUpdateStatus(job: Job<unknown>) {
    try {
      const { isOnline, userId } = job.data as {
        userId: string;
        isOnline: boolean;
      };

      await this.shoemakerRepository.update(
        { id: userId },
        {
          isOnline,
        },
      );
    } catch (error) {
      this.logger.error(error);
      // TODO: Add error handling to sentry
    }
  }
}
