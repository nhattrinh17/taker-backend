import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class WhitelistMiddleware implements NestMiddleware {
  isDev = process.env.IS_DEV === 'true';
  private readonly whitelist = this.isDev
    ? ['113.160.92.202']
    : [
        '113.52.45.78',
        '116.97.245.130',
        '42.118.107.252',
        '113.20.97.250',
        '203.171.19.146',
        '103.220.87.4',
        '103.220.86.4',
      ];

  use(req: Request, res: Response, next: NextFunction) {
    console.log('header', req.headers);
    console.log('whitelist', this.whitelist);
    const forwardedIps = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const cfConnectingIp = req.headers['cf-connecting-ip'] as string;
    const ips = forwardedIps ? forwardedIps.split(',') : [];

    console.log('ips', forwardedIps, realIp, cfConnectingIp, ips);
    if (!ips) {
      throw new ForbiddenException('IP not found');
    }

    const userIp = realIp || cfConnectingIp || ips[0];
    console.log('userIp', userIp);
    if (!this.whitelist.includes(userIp)) {
      throw new ForbiddenException('IP not whitelisted');
    }

    next();
  }
}
