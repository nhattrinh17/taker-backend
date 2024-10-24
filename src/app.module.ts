import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import connectionSource, { typeOrmConfig } from './configs/typeorm';
/**
 * *Import modules
 */
import { ActivitiesModule } from '@customers/activities/activities.module';
import { AuthenticationModule } from '@customers/authentication/authentication.module';
import { CustomersModule } from '@customers/customers.module';
import { NotificationModule } from '@customers/notifications/notifications.module';
import { ProfileModule } from '@customers/profile/profile.module';
import { SearchHistoriesModule } from '@customers/search-histories/search-histories.module';
import { SearchModule } from '@customers/search/search.module';
import { ServicesModule } from '@customers/services/services.module';
import { TripsModule } from '@customers/trips/trips.module';
import { WalletsModule } from '@customers/wallets/wallets.module';

/**
 * *Import modules from shoemakers
 */
import { ActivitiesModule as ShoemakerActivitiesModule } from '@shoemakers/activities/activities.module';
import { AuthenticationModule as ShoemakersAuthenticationModule } from '@shoemakers/authentication/authentication.module';
import { NotificationModule as ShoemakerNotificationModule } from '@shoemakers/notifications/notifications.module';
import { ProfileModule as ShoemakerProfileModule } from '@shoemakers/profile/profile.module';
import { ShoemakersModule } from '@shoemakers/shoemakers.module';
import { TripsModule as ShoemakerTripsModule } from '@shoemakers/trips/trips.module';
import { WalletsModule as ShoemakerWalletsModule } from '@shoemakers/wallets/wallets.module';

/**
 * *Import modules from Admin
 */
import { AdminsModule } from '@admins/admins.module';
import { AuthenticationModule as AdminsAuthenticationModule } from '@admins/authentication/authentication.module';
import { NotificationsModule as AdminsNotificationModule } from '@admins/notifications/notifications.module';
import { OptionModule } from '@admins/options/options.module';
import { ServicesModule as AdminsServiceModule } from '@admins/services/services.module';
import { ShoemakersModule as AdminsShoemakersModule } from '@admins/shoemakers/shoemakers.module';
import { WithdrawalsModule } from '@admins/withdrawals/withdrawals.module';

import { PaymentModule } from 'src/api/payment/payment.module';
import { GatewaysModule } from 'src/gateways/gateways.module';
import { CronsModule } from './api/crons/crons.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VoucherModule } from '@admins/voucher/voucher.module';
import { FirebaseService } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return typeOrmConfig;
      },
      dataSourceFactory: async () => {
        const dataSource = await connectionSource.initialize();
        // console.log(
        //   '🚀 ~ dataSourceFactory: ~ dataSource.isConnected:',
        //   dataSource.isConnected,
        // );
        return dataSource;
      },
    }),
    EventEmitterModule.forRoot({ verboseMemoryLeak: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('QUEUE_HOST'),
          port: configService.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    GatewaysModule,
    CustomersModule,
    AuthenticationModule,
    SearchModule,
    TripsModule,
    ServicesModule,
    ProfileModule,
    ActivitiesModule,
    WalletsModule,
    NotificationModule,
    ShoemakersModule,
    ShoemakersAuthenticationModule,
    SearchHistoriesModule,
    AdminsModule,
    AdminsAuthenticationModule,
    AdminsServiceModule,
    ShoemakerProfileModule,
    ShoemakerActivitiesModule,
    ShoemakerTripsModule,
    ShoemakerNotificationModule,
    ShoemakerWalletsModule,
    PaymentModule,
    AdminsNotificationModule,
    CronsModule,
    AdminsShoemakersModule,
    WithdrawalsModule,
    OptionModule,
    VoucherModule,
    RouterModule.register([
      {
        path: 'customers',
        module: CustomersModule,
        children: [
          {
            path: 'authentication',
            module: AuthenticationModule,
          },
          {
            path: 'profile',
            module: ProfileModule,
          },
          {
            path: 'search',
            module: SearchModule,
          },
          {
            path: 'trips',
            module: TripsModule,
          },
          {
            path: 'search-histories',
            module: SearchHistoriesModule,
          },
          {
            path: 'services',
            module: ServicesModule,
          },
          {
            path: 'activities',
            module: ActivitiesModule,
          },
          {
            path: 'wallets',
            module: WalletsModule,
          },
          {
            path: 'notifications',
            module: NotificationModule,
          },
        ],
      },
      {
        path: 'shoemakers',
        module: ShoemakersModule,
        children: [
          {
            path: 'authentication',
            module: ShoemakersAuthenticationModule,
          },
          {
            path: 'profile',
            module: ShoemakerProfileModule,
          },
          {
            path: 'activities',
            module: ShoemakerActivitiesModule,
          },
          {
            path: 'trips',
            module: ShoemakerTripsModule,
          },
          {
            path: 'notifications',
            module: ShoemakerNotificationModule,
          },
          {
            path: 'wallets',
            module: ShoemakerWalletsModule,
          },
        ],
      },
      {
        path: 'admins',
        module: AdminsModule,
        children: [
          {
            path: 'authentication',
            module: AdminsAuthenticationModule,
          },
          { path: 'services', module: AdminsServiceModule },
          { path: 'notifications', module: AdminsNotificationModule },
          { path: 'shoemakers', module: AdminsShoemakersModule },
          { path: 'withdrawals', module: WithdrawalsModule },
          { path: 'options', module: OptionModule },
          { path: 'vouchers', module: VoucherModule },
        ],
      },
      {
        path: 'payment',
        module: PaymentModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}
