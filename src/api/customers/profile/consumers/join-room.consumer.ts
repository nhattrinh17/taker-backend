import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { In, Repository } from 'typeorm';

import { QUEUE_NAMES, StatusEnum } from '@common/index';
import { GatewaysService } from '@gateways/gateways.service';

import { Trip } from '@entities/index';

@Processor(QUEUE_NAMES.JOIN_ROOM)
export class JoinRoomConsumer {
  private readonly logger = new Logger(JoinRoomConsumer.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly gateWaysService: GatewaysService,
  ) {}

  @Process('join-room')
  async handleJoinRoom(job: Job<unknown>) {
    try {
      const { userId } = job.data as {
        userId: string;
      };

      const trip = await this.tripRepository.findOne({
        where: {
          customerId: userId,
          status: In([
            StatusEnum.ACCEPTED,
            StatusEnum.INPROGRESS,
            StatusEnum.MEETING,
          ]),
        },
      });
      if (trip && trip.shoemakerId) {
        const socket = await this.gateWaysService.getSocket(userId);
        if (socket) {
          socket.join(trip.shoemakerId);
        }
      }
    } catch (error) {
      this.logger.error(error);
      // TODO: Add error handling to sentry
    }
  }
}
