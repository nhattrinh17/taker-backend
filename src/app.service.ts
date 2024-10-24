import { FirebaseService } from '@common/services';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly firebaseService: FirebaseService) {}

  getHello(): string {
    return 'It works 24102024-01';
  }

  async testSendMessageFirebase(token: string) {
    const sendMessage = await this.firebaseService.send({
      body: 'Nhattm test send message',
      title: 'Taker-Nhattm',
      token,
    });
    return sendMessage;
  }
}
