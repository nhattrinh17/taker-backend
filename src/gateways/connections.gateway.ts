import { AppType } from '@common/index';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewaysService } from './gateways.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConnectionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gatewaysService: GatewaysService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: Socket) {
    console.log('AAAAAAAAAAA');
    console.log(
      `Client connected: ${client.id}, ${JSON.stringify(client.handshake.auth)}`,
    );
    // Add the socket to the list of connected sockets
    await this.gatewaysService.addSocket(client.handshake.auth.userId, client);

    // Handle the event when the shoemaker connects
    if ((client.handshake.auth.type = AppType.shoemakers)) {
      this.eventEmitter.emit('shoemaker-update-status', {
        isOnline: true,
        userId: client.handshake.auth.userId,
      });
      // check trip pending
      this.eventEmitter.emit('shoemaker-check-trip-pending', {
        userId: client.handshake.auth.userId,
      });
    }
    if ((client.handshake.auth.type = AppType.customers)) {
      this.eventEmitter.emit('join-room', {
        userId: client.handshake.auth.userId,
      });
    }
    // Make the socket join the room
    client.join(client.handshake.auth.userId);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}, ${client.handshake.auth}`);
    // Remove the socket from the list of connected sockets
    this.gatewaysService.removeSocket(client.handshake.auth.userId);
    // Make the socket leave the room
    client.leave(client.handshake.auth.userId);
    // Handle the event when the shoemaker connects
    // if ((client.handshake.auth.type = AppType.shoemakers)) {
    //   this.eventEmitter.emit('shoemaker-update-status', {
    //     isOnline: false,
    //     userId: client.handshake.auth.userId,
    //   });
    // }

    if ((client.handshake.auth.type = AppType.customers)) {
      this.eventEmitter.emit('leave-room', {
        userId: client.handshake.auth.userId,
      });
    }
  }
}
