import { Module } from '@nestjs/common';
import { ShoemakersListenerService } from './shoemakers-listener.service';

@Module({
  providers: [ShoemakersListenerService],
})
export class ShoemakersModule {}
