import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { ShoemakerUpdatedListener } from './listeners/shoemaker-updated.listener';

import { S3Service, SmsService, StringeeService } from '@common/index';
import { Option, Shoemaker } from '@entities/index';

import { JwtStrategy } from './jwt.strategy';
@Module({
  imports: [
    TypeOrmModule.forFeature([Shoemaker, Option]),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    ShoemakerUpdatedListener,
    StringeeService,
    JwtStrategy,
    S3Service,
    SmsService,
  ],
})
export class AuthenticationModule {}
