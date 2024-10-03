import { generateAccessToken } from '@common/index';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type StringeeRequestProps = {
  toNumber: string;
  otp: number | string;
  fromNumber?: string;
};

@Injectable()
export class StringeeService {
  private readonly logger = new Logger(StringeeService.name);
  constructor(private readonly configService: ConfigService) {}

  async makeCall({ toNumber, otp, fromNumber }: StringeeRequestProps) {
    try {
      const requestData = {
        from: {
          type: 'external',
          number:
            fromNumber || this.configService.get<string>('STRINGEE_NUMBER'),
          alias:
            fromNumber || this.configService.get<string>('STRINGEE_NUMBER'),
        },
        to: [
          {
            type: 'external',
            number: toNumber,
            alias: toNumber,
          },
        ],
        actions: [
          {
            action: 'talk',
            text: `Xin chào, mã xác thực của bạn là. ${otp}. Xin nhắc lại. ${otp}`,
            voice: 'female',
            speed: 0,
          },
        ],
      };
      const accessToken = generateAccessToken();
      this.logger.log(
        `Stringee service request data: ${JSON.stringify(requestData)}`,
      );
      const res = await axios.post(
        'https://api.stringee.com/v1/call2/callout',
        { ...requestData },
        {
          headers: {
            'X-STRINGEE-AUTH': accessToken,
            'Content-Type': 'application/json',
          },
        },
      );
      return res;
    } catch (error) {
      return error;
    }
  }
}
