import { getDatesByWeekOrMonth } from '@common/helpers/date.helper';
import { Shoemaker } from '@entities/shoemaker.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CountShoemakerDto, SearchShoemakerDto } from './dto/search-shoemakers.dto';
import { UpdateInformationDto } from './dto/update-shoemakers.dto';
import { ShoemakerStatusEnum } from '@common/enums';
import { FirebaseService } from '@common/services';

@Injectable()
export class ShoemakersService {
  constructor(
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Function to get a list of shoemakers
   * @param params: SearchShoemakerDto
   * @returns Return a list of shoemakers
   */
  async findList({ take, skip, status, start, end, keyword }: SearchShoemakerDto) {
    try {
      const dates = getDatesByWeekOrMonth('custom', start, end);

      const query = this.shoemakerRepository.createQueryBuilder('s');
      query.select(['s.id', 's.phone', 's.status', 's.fullName', 's.createdAt']);
      // Use addSelect to include the subquery for incomeSum
      query.addSelect((subQuery) => {
        return subQuery
          .select("CONCAT(SUM(t.income), ',', COUNT(t.id))", 'incomeSumAndCount')
          .from('trips', 't')
          .where("t.shoemakerId = s.id AND t.status = 'COMPLETED'")
          .andWhere({ date: In(dates) });
      }, 'incomeSumAndCount');

      query.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(tc.shoemakerId)', 'tripCancellationCount')
          .from('trip_cancellations', 'tc')
          .where('tc.shoemakerId = s.id')
          .andWhere({ date: In(dates) });
      }, 'tripCancellationCount');

      query.leftJoinAndSelect('s.wallet', 'wallet');

      if (status) {
        query.andWhere('s.status = :status', { status });
      }

      if (keyword) {
        query.andWhere('(s.fullName LIKE :keyword OR s.phone LIKE :keyword)', {
          keyword: `%${keyword}%`,
        });
      }
      query.take(take);
      query.skip(skip);
      query.orderBy('s.createdAt', 'DESC');

      // Use getRawAndEntities to get both raw data and entities
      const { entities, raw } = await query.getRawAndEntities();

      // Manually map the results to include incomeSum in your entities
      const items = entities.map((entity, index) => {
        const incomeSumAndCount = raw[index]?.incomeSumAndCount?.split(',')?.map(Number) ?? [0, 0];
        const incomeSum = incomeSumAndCount[0]; // Default to 0 if null
        const count = incomeSumAndCount[1]; //
        return {
          ...entity,
          wallet: entity?.wallet?.balance,
          incomeSum,
          count,
          tripCancellationCount: Number(raw[index].tripCancellationCount),
        };
      });
      return { shoemakers: items };
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Function to count shoemakers
   * @param param: CountShoemakerDto
   * @returns Count of shoemakers
   */
  async countRecords({ status, keyword }: CountShoemakerDto) {
    try {
      const query = this.shoemakerRepository.createQueryBuilder('s');
      if (status) {
        query.andWhere('s.status = :status', { status });
      }

      if (keyword) {
        query.andWhere('(s.fullName LIKE :keyword OR s.phone LIKE :keyword)', {
          keyword: `%${keyword}%`,
        });
      }

      return query.getCount();
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Function to get a shoemaker
   * @param id string
   * @returns Return a shoemaker
   */
  async show(id: string) {
    try {
      const query = this.shoemakerRepository.createQueryBuilder('s');
      query.where({ id });
      // TODO Should make table to store income and count like rating_summary
      query.addSelect((subQuery) => {
        return subQuery.select("CONCAT(SUM(t.income), ',', COUNT(t.id))", 'incomeSumAndCount').from('trips', 't').where("t.shoemakerId = s.id AND t.status = 'COMPLETED'");
      }, 'incomeSumAndCount');

      query.addSelect((subQuery) => {
        return subQuery.select('COUNT(tc.shoemakerId)', 'tripCancellationCount').from('trip_cancellations', 'tc').where('tc.shoemakerId = s.id');
      }, 'tripCancellationCount');

      query.addSelect((subQuery) => {
        return subQuery.select('COUNT(ss.id)', 'referralCount').from('shoemakers', 'ss').where('ss.referralCode = s.phone');
      }, 'referralCount');

      query.leftJoinAndSelect('s.wallet', 'wallet');
      query.leftJoinAndSelect('s.rating', 'rating');

      // Use getRawAndEntities to get both raw data and entities
      const { entities, raw } = await query.getRawAndEntities();
      // Manually map the results to include incomeSum in your entities
      const items = entities.map((entity, index) => {
        const incomeSumAndCount = raw[index]?.incomeSumAndCount?.split(',')?.map(Number) ?? [0, 0];
        const incomeSum = incomeSumAndCount[0];
        const count = incomeSumAndCount[1];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, fcmToken, ...filter } = entity;
        return {
          ...filter,
          wallet: entity?.wallet?.balance,
          totalIncome: incomeSum,
          numberOfTrips: count,
          numberOfCancelation: Number(raw[index].tripCancellationCount),
          rating: {
            average: entity?.rating?.average,
            count: entity?.rating?.count,
          },
          referralCount: Number(raw[index].referralCount),
        };
      });

      return items[0];
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Function to update shoemaker information
   * @param id string
   * @param data UpdateInformationDto
   * @returns return success if update success
   */
  async update(id: string, data: UpdateInformationDto) {
    try {
      const shoemaker = await this.shoemakerRepository.findOne({ where: { id: id } });
      if (!shoemaker) {
        throw new Error('Shoemaker not found');
      }
      await this.shoemakerRepository.update(id, data);
      // Send notification when shoemaker is approved
      if (data.status == ShoemakerStatusEnum.ACTIVE && shoemaker.fcmToken && shoemaker.status !== ShoemakerStatusEnum.ACTIVE) {
        await this.firebaseService.send({
          title: 'Taker',
          body: 'Tài khoản của bạn đã được phê duyệt hãy vào lại app để có thể nhận đơn ngay',
          token: shoemaker.fcmToken,
          data: {
            screen: 'UploadAvatar',
          },
        });
      }
      return 'Success';
    } catch (e) {
      throw new BadRequestException(e?.message);
    }
  }
}
