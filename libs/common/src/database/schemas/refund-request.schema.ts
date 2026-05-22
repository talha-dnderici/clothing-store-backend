import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RefundRequestDocument = HydratedDocument<RefundRequest>;
export type RefundRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed';

@Schema({ timestamps: true, collection: 'refund_requests' })
export class RefundRequest {
  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  orderItemProductId!: string;

  @Prop({ required: true, trim: true })
  productName!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountRate!: number;

  @Prop({ required: true, min: 0 })
  refundedAmount!: number;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  })
  status!: RefundRequestStatus;

  @Prop({ default: '', trim: true })
  reason!: string;

  @Prop({ default: '' })
  decisionNote!: string;

  @Prop({ default: '' })
  reviewedBy!: string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: false })
  stockRestored!: boolean;
}

export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);

RefundRequestSchema.index({ orderId: 1, orderItemProductId: 1, customerId: 1 });
RefundRequestSchema.index({ status: 1, createdAt: -1 });
