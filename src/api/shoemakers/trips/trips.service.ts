import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { QUEUE_NAMES } from '@common/constants/app.constant';
import {
  NOTIFICATIONS_SCREEN,
  SHOEMAKER,
} from '@common/constants/notifications.constant';
import { PaymentEnum, PaymentStatusEnum } from '@common/enums/payment.enum';
import {
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from '@common/enums/transaction.enum';
import { orderId as generateOrderId } from '@common/helpers/index';
import { DEFAULT_MESSAGES, PartialStatusEnum, StatusEnum } from '@common/index';
import { FirebaseService } from '@common/services/firebase.service';
import {
  Notification,
  Shoemaker,
  Transaction,
  Trip,
  Wallet,
  WalletLog,
} from '@entities/index';
import { GatewaysService } from '@gateways/gateways.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly gateWaysService: GatewaysService,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Function to update trip status
   * @param userId string
   * @param dto UpdateTripDto
   * @returns Promise<string>
   */
  async updateTripStatus(
    userId: string,
    { tripId, status, images }: UpdateTripDto,
  ) {
    try {
      // check if the trip exists
      const trip = await this.tripRepository.findOneBy({
        shoemakerId: userId,
        id: tripId,
      });
      if (!trip) throw new NotFoundException('Trip not found');

      const socket = await this.gateWaysService.getSocket(trip.customerId);
      if (
        status === PartialStatusEnum.MEETING &&
        trip.status === StatusEnum.ACCEPTED
      ) {
        await this.tripRepository.update(tripId, {
          status: StatusEnum.MEETING,
        });
        if (socket) {
          socket.emit('trip-status', {
            type: 'success',
            status: StatusEnum.MEETING,
          });
        }
        return DEFAULT_MESSAGES.SUCCESS;
      } else if (
        status === PartialStatusEnum.INPROGRESS &&
        trip.status === StatusEnum.MEETING
      ) {
        await this.tripRepository.update(tripId, {
          status: StatusEnum.INPROGRESS,
          receiveImages: images || [],
        });
        if (socket) {
          socket.emit('trip-status', {
            type: 'success',
            status: StatusEnum.INPROGRESS,
          });
        }
        return DEFAULT_MESSAGES.SUCCESS;
      } else if (
        status === PartialStatusEnum.COMPLETED &&
        trip.status === StatusEnum.INPROGRESS
      ) {
        // update trip status to completed
        await this.tripRepository.update(tripId, {
          status: StatusEnum.COMPLETED,
          completeImages: images || [],
          paymentStatus: PaymentStatusEnum.PAID,
        });
        // update shoemaker status to available
        await this.shoemakerRepository.update(userId, { isTrip: false });
        // create notification for customer
        // await this.notificationRepository.save({
        //   customerId: trip.customerId,
        //   title: 'Hoàn thành đơn hàng',
        //   content: `Đơn hàng của bạn đã hoàn thành. Đánh giá ngay`,
        //   data: JSON.stringify({ tripId: trip.id }),
        // });
        this.notificationQueue.add(
          'after-trip-success-5-minutes',
          {
            customerId: trip.customerId,
          },
          { delay: 5 * 60 * 1000, removeOnComplete: true }, // 5 * 60 * 1000
        );
        // Update wallet
        try {
          await this.updateWallet(trip);
        } catch (error) {}

        if (socket) {
          socket.emit('trip-status', {
            type: 'success',
            status: StatusEnum.COMPLETED,
          });
          socket.leave(trip.shoemakerId);
        }
        return DEFAULT_MESSAGES.SUCCESS;
      }
      throw new BadRequestException('Invalid status');
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to update wallet
   * @param trip Trip
   * @returns Promise<void>
   */
  async updateWallet(trip: Trip) {
    try {
      // If payment method is cash payment
      if (trip.paymentMethod === PaymentEnum.OFFLINE_PAYMENT) {
        await this.dataSource.transaction(async (manager) => {
          // Update wallet for shoemaker
          const wallet = await manager.findOne(Wallet, {
            where: { shoemakerId: trip.shoemakerId },
            lock: { mode: 'pessimistic_write' },
          });
          const amount = trip.fee;
          const currentBalance = wallet.balance;
          const balance = currentBalance - amount;

          let orderId = generateOrderId();

          let foundTransaction = await this.transactionRepository.findOneBy({
            orderId,
          });

          while (foundTransaction) {
            orderId = generateOrderId();
            foundTransaction = await this.transactionRepository.findOneBy({
              orderId,
            });
          }
          // Make transaction for shoemaker
          await manager.save(Transaction, {
            walletId: wallet.id,
            amount: amount,
            description: `Trừ tiền từ đơn hàng ${trip.orderId}`,
            transactionType: TransactionType.WITHDRAW,
            transactionSource: TransactionSource.TRIP,
            status: TransactionStatus.SUCCESS,
            orderId,
            tripId: trip.id,
          });
          // Update wallet balance
          await manager.save(Wallet, { id: wallet.id, balance });
          // Create wallet log
          await manager.save(WalletLog, {
            walletId: wallet.id,
            previousBalance: currentBalance,
            currentBalance: balance,
            amount: amount,
            description: `Trừ tiền từ đơn hàng ${trip.orderId}`,
          });
          // Create notification for shoemaker
          const randomContent = SHOEMAKER.generateWalletMessage(
            amount,
            '-',
            trip.orderId,
          );
          this.notificationQueue.add(
            'update-wallet',
            {
              shoemakerId: trip.shoemakerId,
              message: randomContent.mes03,
            },
            { removeOnComplete: true },
          );
        });
      } else if (
        trip.paymentMethod === PaymentEnum.DIGITAL_WALLET ||
        (trip.paymentMethod === PaymentEnum.CREDIT_CARD &&
          trip.paymentStatus === PaymentStatusEnum.PAID)
      ) {
        await this.dataSource.transaction(async (manager) => {
          // Update wallet for shoemaker
          const wallet = await manager.findOne(Wallet, {
            where: { shoemakerId: trip.shoemakerId },
            lock: { mode: 'pessimistic_write' },
          });
          const amount = trip.income;
          const currentBalance = wallet.balance;
          const balance = currentBalance + amount;

          let orderId = generateOrderId();

          let foundTransaction = await this.transactionRepository.findOneBy({
            orderId,
          });

          while (foundTransaction) {
            orderId = generateOrderId();
            foundTransaction = await this.transactionRepository.findOneBy({
              orderId,
            });
          }
          // Make transaction for shoemaker
          await manager.save(Transaction, {
            walletId: wallet.id,
            amount: amount,
            description: `Cộng tiền từ đơn hàng ${trip.orderId}`,
            transactionType: TransactionType.DEPOSIT,
            transactionSource: TransactionSource.TRIP,
            status: TransactionStatus.SUCCESS,
            orderId,
            tripId: trip.id,
          });
          // Update wallet balance
          await manager.save(Wallet, { id: wallet.id, balance });

          // Create wallet log
          await manager.save(WalletLog, {
            walletId: wallet.id,
            previousBalance: currentBalance,
            currentBalance: balance,
            amount: amount,
            description: `Cộng tiền từ đơn hàng ${trip.orderId}`,
          });

          // Create notification for shoemaker
          const randomContent = SHOEMAKER.generateWalletMessage(
            amount,
            '+',
            trip.orderId,
          );
          this.notificationQueue.add(
            'update-wallet',
            {
              shoemakerId: trip.shoemakerId,
              message: randomContent.mes02,
            },
            { removeOnComplete: true },
          );
        });
      }
    } catch (error) {
      console.log('🚀 ~ [Trip][Update wallet] ~', error);
    }
  }

  /**
   * Function to get detail of a trip
   * @param userId CustomerId
   * @param tripId TripId
   * @returns Trip detail
   */
  async show(userId: string, tripId: string) {
    try {
      const trip = await this.tripRepository.findOne({
        where: {
          id: tripId,
          shoemakerId: userId,
        },
        relations: ['services', 'rating', 'customer'],
      });
      if (!trip) throw new NotFoundException('Invalid trip');

      const { rating, services, customer } = trip;
      return {
        rating: {
          rating: rating?.rating,
          comment: rating?.comment,
        },
        services: services.map(
          ({ price, discountPrice, discount, quantity, name }) => ({
            price,
            discountPrice,
            discount,
            quantity,
            name,
          }),
        ),
        customer: {
          name: customer?.fullName,
          phone: customer?.phone,
          avatar: customer?.avatar,
        },
        orderId: trip.orderId,
        totalPrice: trip.totalPrice,
        images: trip.images,
        receiveImages: trip.receiveImages,
        completeImages: trip.completeImages,
        paymentMethod: trip.paymentMethod,
        paymentStatus: trip.paymentStatus,
        address: trip.address,
        addressNote: trip.addressNote,
        fee: trip.fee,
        income: trip.income,
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
