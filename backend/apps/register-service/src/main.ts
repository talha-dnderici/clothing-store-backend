import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RegisterModule } from './register.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RegisterModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.REGISTER_SERVICE_HOST || '0.0.0.0',
        port: Number(process.env.REGISTER_SERVICE_PORT || 4002),
      },
    },
  );

  await app.listen();
  Logger.log('Register service is listening', 'RegisterService');
}

bootstrap();
