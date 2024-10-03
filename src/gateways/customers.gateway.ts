import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GatewaysService } from './gateways.service';

import { RequestTripData } from '@common/index';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CustomersGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gatewaysService: GatewaysService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @SubscribeMessage('find-closest-shoemakers')
  handleEvent(
    @MessageBody()
    data: RequestTripData,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      'request trip shoemakers',
      client.id,
      client.handshake.auth.userId,
      data,
    );
    this.eventEmitter.emit('find-closest-shoemakers', {
      ...data,
      userId: client.handshake.auth.userId,
    });
  }
}
