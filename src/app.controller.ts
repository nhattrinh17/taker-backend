import { ClientIp } from '@common/decorators/client-ip.decorator';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@ClientIp() ip: string): string {
    return this.appService.getHello();
  }

  @Get('test')
  test() {
    fetch('https://api.taker.vn/v1/payment/ipn', { method: 'GET' }).catch((e) => console.log(e));
  }
}
