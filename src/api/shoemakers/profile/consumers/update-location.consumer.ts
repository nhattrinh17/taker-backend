import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import * as h3 from 'h3-js';
import { Repository } from 'typeorm';

import { Location, QUEUE_NAMES, RESOLUTION } from '@common/index';

import { Shoemaker } from '@entities/index';
import { GatewaysService } from '@gateways/gateways.service';

@Processor(QUEUE_NAMES.UPDATE_LOCATION)
export class UpdateLocationConsumer {
  private readonly logger = new Logger(UpdateLocationConsumer.name);

  constructor(
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
    private readonly gateWaysService: GatewaysService,
  ) {}

  @Process('shoemaker-update-location')
  async handleFindClosestShoemakers(job: Job<unknown>) {
    try {
      const { lat, lng, userId } = job.data as Location & {
        userId: string;
      };

      if (!lat || !lng) return;

      const h = h3.latLngToCell(lat, lng, RESOLUTION);
      console.log('h', h);
      const socket = await this.gateWaysService.getSocket(userId);
      if (socket) {
        this.logger.log('socket', socket.id);
        socket.to(userId).emit('update-location', { lat, lng });
      }
      await this.shoemakerRepository.update(
        { id: userId },
        {
          latitude: lat.toString(),
          longitude: lng.toString(),
          latLongToCell: h,
          isOnline: true,
        },
      );
    } catch (error) {
      this.logger.error(error);
      // TODO: Add error handling to sentry
    }
  }
}
