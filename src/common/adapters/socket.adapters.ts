import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { WsException } from '@nestjs/websockets';

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    server.use((socket: Socket, next) => {
      if (socket.handshake.auth && socket.handshake.auth.token) {
        verify(
          socket.handshake.auth.token as string,
          process.env.JWT_SECRET,
          (err, decoded: { sub: string; type: string }) => {
            if (err) {
              return next(new WsException('Unauthorized'));
            } else {
              socket.handshake.auth.userId = decoded.sub;
              socket.handshake.auth.type = decoded.type;
              next();
            }
          },
        );
      } else {
        return next(new WsException('Unauthorized'));
      }
    });

    return server;
  }
}
