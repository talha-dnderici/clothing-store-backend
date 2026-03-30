import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RefundRequestDocument = HydratedDocument<RefundRequest>;

@Schema({ timestamps: true, collection: 'refund_requests' })
export class RefundRequest {
  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  orderItemProductId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  refundedAmount!: number;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  })
  status!: 'pending' | 'approved' | 'rejected' | 'completed';

  @Prop({ default: '' })
  decisionNote!: string;
}

export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);
