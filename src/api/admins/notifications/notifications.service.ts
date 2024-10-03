import { SystemNotification } from '@entities/system-notification.entity';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Repository } from 'typeorm';
import { QUEUE_NAME } from './constants';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  SearchCountDto,
  SearchNotificationDto,
} from './dto/search-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');
const FORMAT_DATE = 'YYYY-MM-DD HH:mm:ss';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(SystemNotification)
    private repository: Repository<SystemNotification>,
    @InjectQueue(QUEUE_NAME) private queue: Queue,
  ) {}

  async findList({ take, skip, isSent, time }: SearchNotificationDto) {
    try {
      const query = this.repository.createQueryBuilder('s');

      if (isSent === true) {
        query.andWhere({ isSent: true });
      } else if (isSent === false) {
        query.andWhere({ isSent: false });
      }

      if (time) {
        const firstMonth = dayjs().startOf('M').format(FORMAT_DATE);
        const endMonth = dayjs().endOf('M').format(FORMAT_DATE);
        query.andWhere('s.createdAt >= :firstMonth', { firstMonth });
        query.andWhere('s.createdAt <= :endMonth', { endMonth });
      }

      query.orderBy('s.createdAt', 'DESC');
      query.take(take);
      query.skip(skip);

      const items = await query.getMany();
      return { notifications: items };
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  async countRecords({ isSent, time }: SearchCountDto) {
    try {
      const query = this.repository.createQueryBuilder('s');

      if (isSent === true) {
        query.andWhere({ isSent: true });
      } else if (isSent === false) {
        query.andWhere({ isSent: false });
      }

      if (time) {
        const firstMonth = dayjs().startOf('M').format(FORMAT_DATE);
        const endMonth = dayjs().endOf('M').format(FORMAT_DATE);
        query.andWhere('s.createdAt >= :firstMonth', { firstMonth });
        query.andWhere('s.createdAt <= :endMonth', { endMonth });
      }

      return query.getCount();
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Function to create notification
   * @param dto CreateNotificationDto
   * @returns SUCCESS
   */
  async create(dto: CreateNotificationDto) {
    try {
      const entity = {
        title: dto.title,
        content: dto.content,
        receiver: dto.receiver,
      };

      if (!dto.isSentNow && dto.dateTime) {
        entity['scheduleTime'] = dto.dateTime;
      }

      if (dto.isSentNow) entity['isSent'] = true;

      const record = await this.repository.save(entity);

      this.queue.add(
        'send-notification',
        { notification: record, dto },
        {
          delay: dto.isSentNow
            ? 0
            : dto.dateTime
              ? dto.dateTime - dayjs().tz().valueOf()
              : 0,
          jobId: `${QUEUE_NAME}-${record.id}`,
          removeOnComplete: true,
        },
      );
      return 'SUCCESS';
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async show(id: string) {
    try {
      const recordFound = await this.repository.findOneBy({ id });
      if (!recordFound) throw new BadRequestException('Notification not found');

      const query = this.repository.createQueryBuilder('n');
      query.where({ id });
      query.loadRelationCountAndMap(
        'n.numberOfReads',
        'n.notifications',
        'notification',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (qb) => qb.andWhere('notification.isRead = :isRead', { isRead: true }),
      );
      query.loadRelationCountAndMap('n.numberOfSends', 'n.notifications');
      const record = await query.getOne();
      return {
        ...record,
      };
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  async delete(id: string) {
    try {
      const recordFound = await this.repository.findOneBy({ id });
      if (!recordFound) throw new BadRequestException('Notification not found');
      if (recordFound.isSent) throw new BadRequestException('Cant not update');

      const job = await this.queue.getJob(`${QUEUE_NAME}-${recordFound.id}`);
      if (job !== null) {
        await this.queue.removeJobs(`${QUEUE_NAME}-${recordFound.id}`);
      }
      await this.repository.delete(id);
      return 'SUCCESS';
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  async update(dto: UpdateNotificationDto, id: string) {
    try {
      const recordFound = await this.repository.findOneBy({ id });
      if (!recordFound) throw new BadRequestException('Notification not found');
      if (recordFound.isSent) throw new BadRequestException('Cant not update');

      const entity = {
        id: recordFound.id,
        receiver: dto.receiver,
      };

      if (dto.title) entity['title'] = dto.title;
      if (dto.content) entity['content'] = dto.content;

      if (!dto.isSentNow && dto.dateTime) {
        entity['scheduleTime'] = dto.dateTime;
      }

      if (dto.isSentNow) entity['isSent'] = true;
      const record = await this.repository.save(entity);

      const job = await this.queue.getJob(`${QUEUE_NAME}-${recordFound.id}`);
      if (job !== null) {
        await this.queue.removeJobs(`${QUEUE_NAME}-${recordFound.id}`);
      }
      this.queue.add(
        'send-notification',
        { notification: record, dto },
        {
          delay: dto.isSentNow
            ? 0
            : dto.dateTime
              ? dto.dateTime - dayjs().tz().valueOf()
              : 0,
          jobId: `${QUEUE_NAME}-${record.id}`,
          removeOnComplete: true,
        },
      );
      return 'SUCCESS';
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }
}
