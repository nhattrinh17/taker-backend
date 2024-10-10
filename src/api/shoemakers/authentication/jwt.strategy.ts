import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IShoemaker } from '@common/index';
import RedisService from '@common/services/redis.service';

import { AuthenticationService } from './authentication.service';
import { REDIS_PREFIX } from './constants';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'shoemakers-jwt') {
  private readonly redis: RedisService;

  constructor(
    private configService: ConfigService,
    private readonly authService: AuthenticationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });

    const redisClient = new Redis({
      host: this.configService.get<string>('QUEUE_HOST'),
      port: Number(this.configService.get<string>('QUEUE_PORT')),
    });
    this.redis = new RedisService(redisClient);
  }

  async validate(payload: IShoemaker, done: VerifiedCallback) {
    try {
      const key = `${REDIS_PREFIX}${payload.sub}`;
      const check = await this.redis.get(key);
      if (!check) {
        return done(new UnauthorizedException(), false);
      }
      return done(null, payload);
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }
}
