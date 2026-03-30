import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CardModule } from './card.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CardModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.CARD_SERVICE_HOST || '0.0.0.0',
        port: Number(process.env.CARD_SERVICE_PORT || 4004),
      },
    },
  );

  await app.listen();
  Logger.log('Card service is listening', 'CardService');
}

bootstrap();
