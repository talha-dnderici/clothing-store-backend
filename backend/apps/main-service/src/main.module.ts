import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongoConfig } from '@app/common/database/mongo.config';
import { Comment, CommentSchema } from '@app/common/database/schemas/comment.schema';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { ProductManagerController } from './product-manager.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { Product, ProductSchema } from './schemas/product.schema';

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
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [MainController, ProductManagerController],
  providers: [MainService],
})
export class MainModule {}
