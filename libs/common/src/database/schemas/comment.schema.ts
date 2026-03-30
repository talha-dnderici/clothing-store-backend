import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true, trim: true })
  customerName!: string;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  approvalStatus!: 'pending' | 'approved' | 'rejected';

  @Prop({ default: '' })
  reviewedBy!: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
