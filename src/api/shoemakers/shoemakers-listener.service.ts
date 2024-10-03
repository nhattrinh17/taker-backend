import RedisService from '@common/services/redis.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';

@Injectable()
export class ShoemakersListenerService implements OnModuleInit {
  private readonly redis: RedisService;
  private readonly logger = new Logger(ShoemakersListenerService.name);

  constructor(
    private configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const redisClient = new Redis({
      host: this.configService.get<string>('QUEUE_HOST'),
      port: Number(this.configService.get<string>('QUEUE_PORT')),
    });
    this.redis = new RedisService(redisClient);
  }

  isUUID(message: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(message);
  }

  async onModuleInit() {
    console.log('ShoemakersListenerService initialized');
    const redisClient = this.redis.getClient();
    await redisClient.subscribe('__keyevent@0__:expired');

    redisClient.on('message', async (channel, message) => {
      this.logger.log(`Received message: ${message} from channel: ${channel}`);
      if (channel === '__keyevent@0__:expired') {
        if (this.isUUID(message)) {
          this.logger.log('Redis event with id: ' + message + ' is offline');
          this.eventEmitter.emit('shoemaker-update-status', {
            isOnline: false,
            userId: message,
          });
        }
      }
    });
  }
}
