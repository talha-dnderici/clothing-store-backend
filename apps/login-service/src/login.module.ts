import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { SERVICE_TOKENS } from '@app/common/constants/service-tokens';
import { createMongoConfig } from '@app/common/database/mongo.config';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { LoginSession, LoginSessionSchema } from './schemas/login-session.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({}),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createMongoConfig,
    }),
    MongooseModule.forFeature([
      { name: LoginSession.name, schema: LoginSessionSchema },
    ]),
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
