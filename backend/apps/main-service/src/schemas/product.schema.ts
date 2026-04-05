import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '', trim: true })
  model!: string;

  @Prop({ default: '', trim: true, unique: true, sparse: true })
  serialNumber!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, type: [String], default: [] })
  categoryIds!: string[];

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0 })
  stock!: number;

  @Prop({ default: false })
  warrantyStatus!: boolean;

  @Prop({ default: '', trim: true })
  distributor!: string;

  @Prop({ default: 0, min: 0, max: 100 })
  discountRate!: number;

  @Prop({ default: 0, min: 0 })
  popularity!: number;

  @Prop({ default: '' })
  imageUrl!: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
