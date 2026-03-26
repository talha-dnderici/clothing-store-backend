import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoginModule } from './login.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    LoginModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.LOGIN_SERVICE_HOST || '0.0.0.0',
        port: Number(process.env.LOGIN_SERVICE_PORT || 4001),
      },
    },
  );

  await app.listen();
  Logger.log('Login service is listening', 'LoginService');
}

bootstrap();
