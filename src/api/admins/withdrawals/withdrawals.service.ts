import {
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from '@common/enums/transaction.enum';
import { Transaction } from '@entities/transaction.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CountWithdrawalsDto,
  SearchWithdrawalsDto,
} from './dto/search-withdrawals.dto';
import { UpdateWithdrawalsDto } from './dto/update-withdrawals.dto';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Function to find list of withdrawals
   * @param params: SearchWithdrawalsDto
   * @returns Promise<Transaction[]>
   */
  async findList({ take, skip, date, status, keyword }: SearchWithdrawalsDto) {
    try {
      // Find all transactions with transactionType is WITHDRAWAL
      const query = this.transactionRepository.createQueryBuilder('t');
      query.leftJoinAndSelect('t.wallet', 'wallet');
      query.leftJoinAndSelect('wallet.customer', 'customer');
      query.leftJoinAndSelect('wallet.shoemaker', 'shoemaker');
      query.where('t.transactionType = :transactionType', {
        transactionType: TransactionType.WITHDRAW,
      });
      query.andWhere('t.transactionSource = :transactionSource', {
        transactionSource: TransactionSource.WALLET,
      });
      if (status) {
        query.andWhere('t.status = :status', { status });
      }

      if (date) {
        const d = new Date(date).toISOString().split('T')[0];
        query.andWhere('t.transactionDate = :date', { date: d });
      }

      if (keyword) {
        query.andWhere(
          '(customer.fullName LIKE :keyword OR customer.phone LIKE :keyword OR shoemaker.fullName LIKE :keyword OR shoemaker.phone LIKE :keyword)',
          {
            keyword: `%${keyword}%`,
          },
        );
      }
      query.take(take);
      query.skip(skip);

      const items = await query.getMany();
      return {
        withdrawals: items.map((item) => {
          return {
            id: item.id,
            amount: item.amount,
            transactionDate: item.transactionDate,
            status: item.status,
            balance: item?.wallet?.balance,
            evidence: item.evidence,
            user: {
              fullName:
                item.wallet?.customer?.fullName ??
                item.wallet?.shoemaker?.fullName ??
                null,
              phone:
                item.wallet?.customer?.phone ??
                item.wallet?.shoemaker?.phone ??
                null,
              bankAccountNumber:
                item.wallet?.customer?.bankAccountNumber ??
                item.wallet?.shoemaker?.accountNumber ??
                null,
              bankName:
                item.wallet?.customer?.bankName ??
                item.wallet?.shoemaker?.bankName ??
                null,
            },
          };
        }),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Function to count records of withdrawals
   * @param params: CountWithdrawalsDto
   * @returns Promise<number>
   */
  async countRecords({
    date,
    status,
    keyword,
  }: CountWithdrawalsDto): Promise<number> {
    try {
      // Find all transactions with transactionType is WITHDRAWAL
      const query = this.transactionRepository.createQueryBuilder('t');
      query.leftJoinAndSelect('t.wallet', 'wallet');
      query.leftJoinAndSelect('wallet.customer', 'customer');
      query.leftJoinAndSelect('wallet.shoemaker', 'shoemaker');
      query.where('t.transactionType = :transactionType', {
        transactionType: TransactionType.WITHDRAW,
      });
      query.andWhere('t.transactionSource = :transactionSource', {
        transactionSource: TransactionSource.WALLET,
      });
      if (status) {
        query.andWhere('t.status = :status', { status });
      }

      if (date) {
        const d = new Date(date).toISOString().split('T')[0];
        query.andWhere('t.transactionDate = :date', { date: d });
      }

      if (keyword) {
        query.andWhere(
          '(customer.fullName LIKE :keyword OR customer.phone LIKE :keyword OR shoemaker.fullName LIKE :keyword OR shoemaker.phone LIKE :keyword)',
          {
            keyword: `%${keyword}%`,
          },
        );
      }

      return await query.getCount();
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to update status of a withdrawal
   * @param id String
   * @param { evidence: string }
   * @returns Returns a string
   */
  async updateStatus(id: string, { evidence }: UpdateWithdrawalsDto) {
    try {
      const transaction = await this.transactionRepository.findOneBy({ id });
      if (!transaction) {
        throw new BadRequestException('Transaction not found');
      }

      await this.transactionRepository.save({
        id: transaction.id,
        evidence,
        status: TransactionStatus.SUCCESS,
      });

      return 'Success';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
