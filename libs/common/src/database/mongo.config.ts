import { ConfigService } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export const createMongoConfig = (
  configService: ConfigService,
): MongooseModuleFactoryOptions => ({
  uri: configService.getOrThrow<string>('MONGODB_URI'),
});
