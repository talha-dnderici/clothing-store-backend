import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation keeps DTO rules active across the whole gateway
  // and automatically strips unexpected fields from incoming requests.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT || process.env.GATEWAY_PORT || 3000);
  await app.listen(port, process.env.GATEWAY_HOST || '0.0.0.0');

  Logger.log(`API gateway is listening on port ${port}`, 'ApiGateway');
}

bootstrap();
