import RedisService from '@common/services/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { QUEUE_NAMES } from '@common/index';

@Injectable()
export class UpdateStatusListener {
  private readonly logger = new Logger(UpdateStatusListener.name);
  private readonly redis: RedisService;
  constructor(
    @InjectQueue(QUEUE_NAMES.UPDATE_STATUS) private queue: Queue,
    private configService: ConfigService,
  ) {
    const redisClient = new Redis({
      host: this.configService.get<string>('QUEUE_HOST'),
      port: Number(this.configService.get<string>('QUEUE_PORT')),
    });
    this.redis = new RedisService(redisClient);
  }

  @OnEvent('shoemaker-update-status')
  async handleUpdateLocationListener(data: {
    userId: string;
    isOnline: boolean;
  }) {
    try {
      this.queue.add('shoemaker-update-status', data, {
        removeOnComplete: true,
      });
      if (data.isOnline) {
        this.redis.setExpire(data.userId, 'online', 60 * 15);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
