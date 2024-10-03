import {
  NOTIFICATIONS_SCREEN,
  SHOEMAKER,
} from '@common/constants/notifications.constant';
import { createPaymentUrl } from '@common/helpers/payment.helper';
import {
  DEFAULT_MESSAGES,
  IShoemaker,
  TransactionType,
  orderId as generateOrderId,
} from '@common/index';
import { FirebaseService } from '@common/services/firebase.service';
import { Shoemaker } from '@entities/shoemaker.entity';
import { Transaction } from '@entities/transaction.entity';
import { WalletLog } from '@entities/wallet-log.entity';
import { Wallet } from '@entities/wallet.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DepositDto, WithdrawDto } from './dto/create-wallet.dto';
import { TransactionListDto } from './dto/transaction-list.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Shoemaker)
    private readonly shoemakerRepository: Repository<Shoemaker>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Function to get url for deposit
   * @param userId string
   * @param dto DepositDto
   * @param ip string
   * @returns paymentUrl
   */
  async deposit({ sub }: IShoemaker, dto: DepositDto, ip: string) {
    try {
      const shoemaker = await this.shoemakerRepository.findOne({
        where: { id: sub },
        relations: ['wallet'],
      });
      if (!shoemaker) {
        throw new NotFoundException('Shoemaker not found');
      }
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

      const transaction = await this.transactionRepository.save({
        amount: dto.amount,
        transactionType: TransactionType.DEPOSIT,
        walletId: shoemaker.wallet.id,
        transactionDate: new Date(),
        description: 'Nap tien vao vi taker',
        orderId,
        ipRequest: ip,
      });

      return createPaymentUrl({
        amount: dto.amount,
        ip,
        orderId,
        orderInfo: transaction.description,
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to get list of transactions
   * @param userId string
   * @param param1 transactionListDto
   * @returns Return list of transactions
   */
  async getTransactions(userId: string, { take, skip }: TransactionListDto) {
    try {
      const shoemaker = await this.shoemakerRepository.findOne({
        where: { id: userId },
        relations: ['wallet'],
      });
      if (!shoemaker) {
        throw new NotFoundException('Shoemaker not found');
      }

      const transactions = await this.transactionRepository.find({
        select: [
          'amount',
          'transactionType',
          'transactionDate',
          'description',
          'status',
          'transactionSource',
          'createdAt',
        ],
        where: { walletId: shoemaker.wallet.id },
        take,
        skip,
        order: { createdAt: 'DESC' },
      });

      return transactions;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to get balance
   * @param userId string
   * @returns balance
   */
  async getBalance(userId: string) {
    try {
      const shoemaker = await this.shoemakerRepository.findOne({
        where: { id: userId },
        relations: ['wallet'],
      });
      if (!shoemaker) {
        throw new NotFoundException('Shoemaker not found');
      }

      return shoemaker.wallet.balance;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to request withdrawal money
   * @param userId string
   * @returns Message
   */
  async requestWithdrawal({ sub }: IShoemaker, dto: WithdrawDto) {
    try {
      const shoemaker = await this.shoemakerRepository.findOne({
        where: { id: sub },
        relations: ['wallet'],
      });
      if (!shoemaker) {
        throw new NotFoundException('Shoemaker not found');
      }
      if (shoemaker.wallet.balance < dto.amount) {
        throw new BadRequestException('Not enough balance');
      }

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

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // execute some operations on this transaction:
        const newBalance = shoemaker.wallet.balance - dto.amount;
        await queryRunner.manager.update(
          Wallet,
          { id: shoemaker.wallet.id },
          { balance: newBalance },
        );
        await queryRunner.manager.save(Transaction, {
          amount: dto.amount,
          transactionType: TransactionType.WITHDRAW,
          walletId: shoemaker.wallet.id,
          transactionDate: new Date(),
          description: 'Yêu cầu rút tiền',
          orderId,
          isManual: true,
        });
        await queryRunner.manager.save(WalletLog, {
          amount: dto.amount,
          walletId: shoemaker.wallet.id,
          previousBalance: shoemaker.wallet.balance,
          currentBalance: newBalance,
          description: `Yêu cầu rút tiền transactionId=${orderId}`,
        });
        if (shoemaker.fcmToken) {
          this.firebaseService
            .sends([
              {
                token: shoemaker.fcmToken,
                title: 'TAKER',
                body: SHOEMAKER.generateWalletMessage(dto.amount, '+').mes04,
                data: { screen: NOTIFICATIONS_SCREEN.WALLET },
              },
              {
                token: shoemaker.fcmToken,
                title: 'TAKER',
                body: SHOEMAKER.generateWalletMessage(dto.amount, '-').mes05,
                data: { screen: NOTIFICATIONS_SCREEN.WALLET },
              },
            ])
            .catch((e) => {
              console.log('Error while sending notification', e);
            });
        }
        // commit transaction now:
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
      }

      return DEFAULT_MESSAGES.SUCCESS;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
