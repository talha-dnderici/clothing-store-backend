import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MainModule } from './main.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MainModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.MAIN_SERVICE_HOST || '0.0.0.0',
        port: Number(process.env.MAIN_SERVICE_PORT || 4003),
      },
    },
  );

  await app.listen();
  Logger.log('Main service is listening', 'MainService');
}

bootstrap();
