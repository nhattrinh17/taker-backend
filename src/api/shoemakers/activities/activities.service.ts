import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { StatusEnum, calculateTimeDifference } from '@common/index';
import { Trip } from '@entities/index';

import { ActivityDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Trip) private readonly tripRep: Repository<Trip>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Function to get all trips that are in progress
   * @param userId string
   * @returns List of trips that are in progress
   */
  async inProgress(userId: string) {
    try {
      const trips = await this.tripRep.find({
        select: {
          id: true,
          address: true,
          status: true,
          totalPrice: true,
          paymentMethod: true,
          latitude: true,
          longitude: true,
          paymentStatus: true,
          addressNote: true,
          fee: true,
          income: true,
          services: {
            price: true,
            discount: true,
            quantity: true,
            name: true,
            discountPrice: true,
          },
          customer: {
            fullName: true,
            avatar: true,
            phone: true,
          },
          shoemaker: {
            latitude: true,
            longitude: true,
          },
        },
        where: {
          shoemakerId: userId,
          status: In([
            StatusEnum.ACCEPTED,
            StatusEnum.INPROGRESS,
            StatusEnum.MEETING,
          ]),
        },
        relations: ['services', 'customer', 'shoemaker'],
      });

      return trips.map((trip) => {
        return {
          ...trip,
          distance: calculateTimeDifference(
            Number(trip.shoemaker.latitude) || 0,
            Number(trip.shoemaker.longitude) || 0,
            Number(trip.latitude),
            Number(trip.longitude),
          ).distance,
        };
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to get all trips that are completed or canceled by the customer
   * @param userId string
   * @param take number
   * @param skip number
   * @returns List of trips that are completed or canceled by the customer
   */
  async histories(userId: string, { take, skip }: ActivityDto) {
    try {
      const trips = await this.tripRep.find({
        select: {
          id: true,
          address: true,
          status: true,
          totalPrice: true,
          latitude: true,
          longitude: true,
          createdAt: true,
          fee: true,
          income: true,
          rating: {
            rating: true,
          },
          customer: {
            id: true,
          },
        },
        where: {
          shoemakerId: userId,
          status: In([
            StatusEnum.COMPLETED,
            StatusEnum.SHOEMAKER_CANCEL,
            StatusEnum.CUSTOMER_CANCEL,
          ]),
        },
        relations: ['rating', 'customer'],
        take,
        skip,
        order: {
          createdAt: 'DESC',
        },
      });
      return trips;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
