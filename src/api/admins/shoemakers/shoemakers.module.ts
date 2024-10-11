import { Shoemaker } from '@entities/shoemaker.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoemakersController } from './shoemakers.controller';
import { ShoemakersService } from './shoemakers.service';
import { FirebaseService } from '@common/services';

@Module({
  imports: [TypeOrmModule.forFeature([Shoemaker])],
  controllers: [ShoemakersController],
  providers: [ShoemakersService, FirebaseService],
})
export class ShoemakersModule {}
