import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, trim: true, unique: true })
  name!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ trim: true, unique: true, sparse: true })
  slug?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ trim: true, default: null })
  parentCategoryId?: string | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
