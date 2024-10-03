import { IReturnUrl, QUEUE_NAMES } from '@common/constants/app.constant';
import {
  CUSTOMERS,
  NOTIFICATIONS_SCREEN,
  SHOEMAKER,
} from '@common/constants/notifications.constant';
import {
  PaymentStatusEnum,
  StatusEnum,
  TransactionStatus,
} from '@common/enums';
import { FirebaseService } from '@common/services/firebase.service';
import { Customer } from '@entities/customer.entity';
import { Notification } from '@entities/notification.entity';
import { Shoemaker } from '@entities/shoemaker.entity';
import { Transaction } from '@entities/transaction.entity';
import { Trip } from '@entities/trip.entity';
import { Wallet } from '@entities/wallet.entity';
import { GatewaysService } from '@gateways/gateways.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import {
  DataSource,
  OptimisticLockVersionMismatchError,
  Repository,
} from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
    private readonly gatewaysService: GatewaysService,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
    @InjectQueue(QUEUE_NAMES.CUSTOMERS_TRIP) private queue: Queue,
  ) {}

  /**
   * Find transaction by orderId
   * @param orderId String
   * @returns Promise<Transaction>
   */
  checkOrderId(orderId: string) {
    return this.transactionRepository.findOneBy({ orderId });
  }

  checkTripId(orderId: string) {
    return this.tripRepository.findOneBy({ orderId });
  }

  /**
   * Update transaction
   * @param transaction Transaction
   * @returns Promise<Transaction>
   */
  updateTransaction(
    id: string,
    status: TransactionStatus,
    vnPayData: string,
    ipIpn: string,
  ) {
    return this.transactionRepository.save({ id, status, vnPayData, ipIpn });
  }

  /**
   * Update trip
   * @param id string
   * @param paymentStatus PaymentStatusEnum
   * @param vnPayData string
   * @param ipIpn string
   * @returns Promise<Trip>
   */
  updateTrip(
    id: string,
    paymentStatus: PaymentStatusEnum,
    vnPayData: string,
    ipIpn: string,
  ) {
    return this.tripRepository.save({ id, paymentStatus, vnPayData, ipIpn });
  }

  /**
   * Function to update wallet balance
   * @param transactionId string
   * @returns Nothing
   */
  async updateWallet(transactionId: string) {
    try {
      const transaction = await this.transactionRepository.findOneBy({
        id: transactionId,
      });
      if (!transaction && transaction.status !== TransactionStatus.SUCCESS)
        return;

      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`Attempt ${attempt + 1}`);
        try {
          await this.dataSource.transaction(
            async (transactionalEntityManager) => {
              const wallet = await transactionalEntityManager.findOne(Wallet, {
                where: { id: transaction.walletId },
                lock: { mode: 'pessimistic_write' },
              });
              if (!wallet) {
                throw new Error('Wallet not found');
              }

              const newBalance = wallet.balance + transaction.amount;
              await transactionalEntityManager.save(Wallet, {
                id: wallet.id,
                balance: newBalance,
              });
              // Create a notification for the customer or shoemaker
              if (wallet.customerId) {
                await this.notificationRepository.save({
                  customerId: wallet.customerId,
                  title: 'TAKER',
                  content: CUSTOMERS.generateWalletMessage(newBalance, '+')
                    .mes01,
                  data: JSON.stringify({
                    screen: NOTIFICATIONS_SCREEN.WALLET,
                  }),
                });
                const customer = await this.customerRepository.findOneBy({
                  id: wallet.customerId,
                });
                if (customer.fcmToken) {
                  try {
                    await this.firebaseService.send({
                      token: customer.fcmToken,
                      title: 'TAKER',
                      body: CUSTOMERS.generateWalletMessage(
                        transaction.amount,
                        '+',
                      ).mes01,
                      data: { screen: NOTIFICATIONS_SCREEN.WALLET },
                    });
                  } catch (ee) {}
                }
              } else if (wallet.shoemakerId) {
                await this.notificationRepository.save({
                  shoemakerId: wallet.shoemakerId,
                  title: 'TAKER',
                  content: SHOEMAKER.generateWalletMessage(
                    transaction.amount,
                    '+',
                  ).mes01,
                  data: JSON.stringify({
                    screen: NOTIFICATIONS_SCREEN.WALLET,
                  }),
                });

                const shoemaker = await this.shoemakerRepository.findOneBy({
                  id: wallet.shoemakerId,
                });
                if (shoemaker.fcmToken) {
                  try {
                    await this.firebaseService.send({
                      token: shoemaker.fcmToken,
                      title: 'TAKER',
                      body: SHOEMAKER.generateWalletMessage(newBalance, '+')
                        .mes01,
                      data: { screen: NOTIFICATIONS_SCREEN.WALLET },
                    });
                  } catch (ee) {}
                }
              }
            },
          );
          return;
        } catch (e) {
          if (e instanceof OptimisticLockVersionMismatchError) {
            // Log the optimistic lock error and retry
            console.log(
              `Attempt ${attempt + 1} failed due to optimistic lock. Retrying...`,
            );
          } else {
            // For other errors, log and rethrow them
            console.error('Unexpected error:', e);
            throw e;
          }
        }
      }
    } catch (error) {
      console.error('[PAYMENT][UPDATE_WALLET]', error);
    }
  }

  /**
   * Function to update payment status for client
   * @param transactionId string
   * @param data IReturnUrl
   * @returns Emit to client
   */
  async updateStatusForClient(transactionId: string, data: IReturnUrl) {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        relations: ['wallet'],
      });

      if (!transaction) return;

      if (transaction?.wallet?.customerId || transaction?.wallet?.shoemakerId) {
        const socket = await this.gatewaysService.getSocket(
          transaction?.wallet?.customerId || transaction?.wallet?.shoemakerId,
        );
        if (socket) {
          console.log('[PAYMENT][UPDATE_STATUS_FOR_CLIENT]', { ...data });
          socket.emit('payment-status', {
            transactionId: data.vnp_TxnRef,
            amount: Number(data.vnp_Amount) / 100,
            status: data.vnp_ResponseCode,
          });
        }
      }
    } catch (e) {
      console.error('[PAYMENT][UPDATE_STATUS_FOR_CLIENT]', e);
    }
  }

  async updateTripStatusForClient(trip: Trip, data: IReturnUrl) {
    try {
      const customerId = trip.customerId;
      const socket = await this.gatewaysService.getSocket(customerId);
      if (socket) {
        console.log('[PAYMENT][UPDATE_TRIP_STATUS_FOR_CLIENT]', { ...data });
        socket.emit('trip-status', {
          transactionId: data.vnp_TxnRef,
          amount: Number(data.vnp_Amount) / 100,
          status: data.vnp_ResponseCode,
        });
      }
    } catch (e) {
      console.error('[PAYMENT][UPDATE_TRIP_STATUS_FOR_CLIENT]', e);
    }
  }
}
