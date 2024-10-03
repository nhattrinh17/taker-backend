import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewaysService } from './gateways.service';

import { AppType } from '@common/index';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ShoemakersGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gatewaysService: GatewaysService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @SubscribeMessage('shoemaker-update-location')
  handleEvent(
    @MessageBody()
    data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      'shoemaker-update-location',
      client.id,
      client.handshake.auth.userId,
      data,
    );
    if ((client.handshake.auth.type = AppType.shoemakers)) {
      this.eventEmitter.emit('shoemaker-update-location', {
        ...data,
        userId: client.handshake.auth.userId,
      });
    }
  }

  @SubscribeMessage('online')
  handleOnline(
    @MessageBody()
    data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('online', client.handshake?.auth?.userId, data);
  }
}
