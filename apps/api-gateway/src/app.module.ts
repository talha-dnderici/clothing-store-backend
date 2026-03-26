import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SERVICE_TOKENS } from '@app/common/constants/service-tokens';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClientsModule.registerAsync([
      {
        name: SERVICE_TOKENS.LOGIN,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('LOGIN_SERVICE_HOST', '127.0.0.1'),
            port: Number(configService.get<string>('LOGIN_SERVICE_PORT', '4001')),
          },
        }),
      },
      {
        name: SERVICE_TOKENS.REGISTER,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('REGISTER_SERVICE_HOST', '127.0.0.1'),
            port: Number(configService.get<string>('REGISTER_SERVICE_PORT', '4002')),
          },
        }),
      },
      {
        name: SERVICE_TOKENS.MAIN,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('MAIN_SERVICE_HOST', '127.0.0.1'),
            port: Number(configService.get<string>('MAIN_SERVICE_PORT', '4003')),
          },
        }),
      },
      {
        name: SERVICE_TOKENS.CARD,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('CARD_SERVICE_HOST', '127.0.0.1'),
            port: Number(configService.get<string>('CARD_SERVICE_PORT', '4004')),
          },
        }),
      },
    ]),
  ],
  controllers: [AppController],
})
export class AppModule {}
