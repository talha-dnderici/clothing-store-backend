import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LoginSessionDocument = HydratedDocument<LoginSession>;

@Schema({ timestamps: true, collection: 'login_sessions' })
export class LoginSession {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  token!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const LoginSessionSchema = SchemaFactory.createForClass(LoginSession);
