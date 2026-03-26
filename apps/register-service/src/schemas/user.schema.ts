import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: '' })
  taxId!: string;

  @Prop({ default: '' })
  address!: string;

  @Prop({
    type: String,
    enum: ['customer', 'salesManager', 'productManager'],
    default: 'customer',
  })
  role!: 'customer' | 'salesManager' | 'productManager';
}

export const UserSchema = SchemaFactory.createForClass(User);
