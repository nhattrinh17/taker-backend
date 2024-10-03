import { IReturnUrl } from '@common/constants/app.constant';
import { TransactionLogStatus } from '@common/enums/transaction.enum';
import { TransactionLog } from '@entities/transaction-log.entity';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionLogListener {
  private readonly logger = new Logger(TransactionLogListener.name);
  constructor(
    @InjectRepository(TransactionLog)
    private readonly logRepository: Repository<TransactionLog>,
  ) {}

  @OnEvent('transaction-log')
  async handleLogListener(
    data: IReturnUrl & {
      ipIpn: string;
      status: TransactionLogStatus;
      message?: string;
    },
  ) {
    const { status } = data;
    const vnpData = { ...data };

    delete vnpData.status;
    delete vnpData.ipIpn;
    delete vnpData.message;

    try {
      await this.logRepository.save({
        status,
        vnPayData: JSON.stringify(vnpData),
        ipIpn: data.ipIpn,
        date: new Date(),
        transactionId: data.vnp_TxnRef,
        message: data.message,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
