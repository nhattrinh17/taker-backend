import { SOCKET_PREFIX } from '@common/constants/app.constant';
import RedisService from '@common/services/redis.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class GatewaysService {
  @WebSocketServer()
  server: Server;

  private readonly redis: RedisService;
  // private readonly sockets = new Map<string, Socket>();

  constructor(private configService: ConfigService) {
    const redisClient = new Redis({
      host: this.configService.get<string>('QUEUE_HOST'),
      port: Number(this.configService.get<string>('QUEUE_PORT')),
    });
    this.redis = new RedisService(redisClient);
  }

  public async addSocket(id: string, socket: Socket) {
    await this.redis.set(`${SOCKET_PREFIX}${id}`, socket.id);
    // this.sockets.set(id, socket);
  }

  public async removeSocket(id: string) {
    // this.sockets.delete(id);
    await this.redis.del(`${SOCKET_PREFIX}${id}`);
  }

  public async getSocket(id: string) {
    const socketId = await this.redis.get(`${SOCKET_PREFIX}${id}`);
    console.log('socketId', socketId);
    if (socketId) return this.server.sockets.sockets.get(socketId);
    return null;
  }
}
