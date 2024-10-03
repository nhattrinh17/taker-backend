import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as h3 from 'h3-js';

import { Shoemaker } from '@entities/index';

@Injectable()
export class ShoemakerUpdatedListener {
  private readonly logger = new Logger(ShoemakerUpdatedListener.name);
  constructor(
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
  ) {}

  @OnEvent('shoemaker.update.location')
  async handleShoemakerUpdatedEvent(event: any) {
    try {
      // handle and process "OrderCreatedhandleShoemakerUpdatedEventEvent" event
      const length = event.length;
      const shoemakers = await this.shoemakerRepository.find({
        order: { createdAt: 'DESC' },
        take: length,
      });

      // Update the shoemakers with location and h3 index
      console.log(event, shoemakers);
      const res = 9;

      const updatedShoemakers = event.map(
        ({ latitude, longitude }, index: number) => {
          const h = h3.latLngToCell(Number(latitude), Number(longitude), res);
          return {
            latitude,
            longitude,
            latLongToCell: h,
            id: shoemakers[index].id,
          };
        },
      );

      await this.shoemakerRepository.save(updatedShoemakers);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
