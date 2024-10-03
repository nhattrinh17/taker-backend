import { FirebaseService } from '@common/services/firebase.service';
import { Shoemaker } from '@entities/shoemaker.entity';
import { Transaction } from '@entities/transaction.entity';
import { Wallet } from '@entities/wallet.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shoemaker, Transaction, Wallet])],
  controllers: [WalletsController],
  providers: [WalletsService, FirebaseService],
})
export class WalletsModule {}
