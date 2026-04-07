import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongoConfig } from '@app/common/database/mongo.config';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { Card, CardSchema } from './schemas/card.schema';
import { Product, ProductSchema } from '../../main-service/src/schemas/product.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createMongoConfig,
    }),
    MongooseModule.forFeature([
      { name: Card.name, schema: CardSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
