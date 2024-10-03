import {
  Admin,
  Customer,
  Notification,
  Option,
  RatingSummary,
  SearchHistory,
  Service,
  Shoemaker,
  SystemNotification,
  Transaction,
  TransactionLog,
  Trip,
  TripCancellation,
  TripLog,
  TripRating,
  TripService,
  Wallet,
  WalletLog,
} from '@entities/index';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

import { config } from 'dotenv';
config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'mysql',
  replication: {
    master: {
      host: process.env.MYSQL_HOST,
      port: +process.env.MYSQL_PORT,
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    },
    slaves: [
      {
        host: process.env.MYSQL_SLAVES_HOST,
        port: +process.env.MYSQL_PORT,
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_SLAVES_DATABASE,
      },
    ],
  },
  entities: [
    Admin,
    Customer,
    Notification,
    RatingSummary,
    SearchHistory,
    Service,
    Shoemaker,
    SystemNotification,
    TransactionLog,
    Transaction,
    TripCancellation,
    TripRating,
    TripService,
    Trip,
    WalletLog,
    Wallet,
    TripLog,
    Option,
  ],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  migrationsRun: process.env.MIGRATIONS_RUN as any,
  logging: false,
};

const connectionSource = new DataSource({ ...typeOrmConfig });
export default connectionSource;
