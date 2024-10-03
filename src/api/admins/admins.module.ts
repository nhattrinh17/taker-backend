import { S3Service } from '@common/services/s3.service';
import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
@Module({
  providers: [S3Service],
  controllers: [AdminsController],
})
export class AdminsModule {}
