import { IReturnUrl } from '@common/constants/app.constant';
import { ClientIp } from '@common/decorators/client-ip.decorator';
import {
  PaymentStatusEnum,
  TransactionLogStatus,
  TransactionStatus,
} from '@common/enums';
import { checkIdType } from '@common/helpers/encryption.helper';
import { validateSecureHash } from '@common/helpers/payment.helper';
import { Controller, Get, Query, Req, Res, Version } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(
    private readonly service: PaymentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Version('1')
  @Get('returnUrl')
  async paymentReturnUrl(@Query() query: IReturnUrl, @Res() res: Response) {
    console.log('[VNPAY][RETURN URL][QUERY]', query);
    if (validateSecureHash(query)) {
      const orderId = query.vnp_TxnRef;
      const isTripId = checkIdType(orderId) === 'tripId';

      if (isTripId) {
        const trip = await this.service.checkTripId(orderId);
        trip && this.service.updateTripStatusForClient(trip, query);
      } else {
        const transaction = await this.service.checkOrderId(orderId);
        transaction &&
          this.service.updateStatusForClient(transaction.id, query);
      }
      if (query.vnp_ResponseCode === '00') {
        res.redirect(`http://success.sdk.merchantbackapp`);
      } else if (query.vnp_ResponseCode === '24') {
        res.redirect(`http://cancel.sdk.merchantbackapp`);
      } else {
        res.redirect(`http://fail.sdk.merchantbackapp`);
      }
    } else {
      res.redirect(`http://fail.sdk.merchantbackapp`);
    }
  }

  @Version('1')
  @Get('ipn')
  async paymentIpn(
    @Query() query: IReturnUrl,
    @Res() res: Response,
    @Req() req: Request,
    @ClientIp() ip: string,
  ) {
    try {
      console.log('[VNPAY][IPN][QUERY]', query);
      // Validate secure hash
      if (validateSecureHash(query)) {
        // Check orderId
        const orderId = query.vnp_TxnRef;
        if (!orderId) {
          this.eventEmitter.emit('transaction-log', {
            ...query,
            status: TransactionLogStatus.FAILED,
            ipIpn: ip,
            message: 'Order not found',
          });

          return res
            .status(200)
            .json({ RspCode: '01', Message: 'Order not found' });
        }
        const isTripId = checkIdType(orderId) === 'tripId';
        //* If orderId is tripId
        if (isTripId) {
          const trip = await this.service.checkTripId(orderId);
          if (!trip)
            return res
              .status(200)
              .json({ RspCode: '01', Message: 'Transaction not found' });

          // Check amount
          const amount = Number(query.vnp_Amount) / 100;
          if (amount !== trip.totalPrice) {
            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.FAILED,
              ipIpn: ip,
              message: 'Amount not match',
            });

            return res
              .status(200)
              .json({ RspCode: '04', Message: 'Amount not match' });
          }

          // Check status
          if (trip.paymentStatus === PaymentStatusEnum.PAID) {
            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.FAILED,
              ipIpn: ip,
              message: 'This order has been updated to the payment status',
            });

            return res.status(200).json({
              RspCode: '02',
              Message: 'This order has been updated to the payment status',
            });
          }

          // Update transaction
          if (query.vnp_ResponseCode === '00') {
            await this.service.updateTrip(
              trip.id,
              PaymentStatusEnum.PAID,
              JSON.stringify(query),
              ip,
            );

            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.SUCCESS,
              ipIpn: ip,
              message: 'Success',
            });
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
          } else {
            await this.service.updateTrip(
              trip.id,
              PaymentStatusEnum.FAILED,
              JSON.stringify(query),
              ip,
            );
            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.FAILED,
              ipIpn: ip,
              message: 'Response code not 00',
            });
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
          }
          //* If orderId is transactionId
        } else {
          const transaction = await this.service.checkOrderId(orderId);
          if (!transaction)
            return res
              .status(200)
              .json({ RspCode: '01', Message: 'Transaction not found' });

          // Check amount
          const amount = Number(query.vnp_Amount) / 100;
          if (amount !== transaction.amount) {
            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.FAILED,
              ipIpn: ip,
              message: 'Amount not match',
            });

            return res
              .status(200)
              .json({ RspCode: '04', Message: 'Amount not match' });
          }

          // Check status
          if (transaction.status === TransactionStatus.SUCCESS) {
            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.FAILED,
              ipIpn: ip,
              message: 'This order has been updated to the payment status',
            });

            return res.status(200).json({
              RspCode: '02',
              Message: 'This order has been updated to the payment status',
            });
          }

          // Update transaction
          if (query.vnp_ResponseCode === '00') {
            await this.service.updateTransaction(
              transaction.id,
              TransactionStatus.SUCCESS,
              JSON.stringify(query),
              ip,
            );
            await this.service.updateWallet(transaction.id);

            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.SUCCESS,
              ipIpn: ip,
              message: 'Success',
            });
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
          } else {
            await this.service.updateTransaction(
              transaction.id,
              TransactionStatus.FAILED,
              JSON.stringify(query),
              ip,
            );
            this.eventEmitter.emit('transaction-log', {
              ...query,
              status: TransactionLogStatus.FAILED,
              ip,
              message: 'Response code not 00',
            });
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
          }
        }
      } else {
        this.eventEmitter.emit('transaction-log', {
          ...query,
          status: TransactionLogStatus.FAILED,
          ipIpn: ip,
          message: 'Checksum failed',
        });
        return res
          .status(200)
          .json({ RspCode: '97', Message: 'Checksum failed' });
      }
    } catch (error) {
      //TODO: Send log to Sentry
      console.error('[VNPAY][IPN] ERROR', error, JSON.stringify(query));
      this.eventEmitter.emit('transaction-log', {
        ...query,
        status: TransactionLogStatus.UN_KNOW,
        ipIpn: ip,
      });
      res.status(200).json({ RspCode: '99', Message: 'Unknow error' });
    }
  }
}
