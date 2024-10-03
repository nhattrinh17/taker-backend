import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BaseExceptionFilter,
  HttpAdapterHost,
  NestFactory,
} from '@nestjs/core';
import * as Sentry from '@sentry/node';
import * as bodyParser from 'body-parser';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import './instrument';

import {
  HttpExceptionFilter,
  LoggingInterceptor,
  SocketIoAdapter,
  TransformInterceptor,
} from '@common/index';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  console.log('🚀 ~ bootstrap ~ port:', port);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useWebSocketAdapter(new SocketIoAdapter(app));

  const { httpAdapter } = app.get(HttpAdapterHost);
  Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter));

  const adminConfig: ServiceAccount = {
    projectId: configService.get('FIREBASE_PROJECT_ID'),
    privateKey: configService.get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    clientEmail: configService.get('FIREBASE_CLIENT_EMAIL'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
  });
  admin.messaging();

  await app.listen(port);
}
bootstrap();
