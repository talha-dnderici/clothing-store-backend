import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ _id: false })
export class DiscountNotificationMetadata {
  @Prop({ default: 0 })
  discountRate!: number;

  @Prop({ default: 0 })
  originalPrice!: number;

  @Prop({ default: 0 })
  discountedPrice!: number;
}

export const DiscountNotificationMetadataSchema = SchemaFactory.createForClass(
  DiscountNotificationMetadata,
);

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true, index: true })
  customerId!: string;

  @Prop({ required: true, enum: ['discount'] })
  type!: 'discount';

  @Prop({ required: true, index: true })
  productId!: string;

  @Prop({ required: true, trim: true })
  productName!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ default: false, index: true })
  isRead!: boolean;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  @Prop({ type: DiscountNotificationMetadataSchema, default: {} })
  metadata!: DiscountNotificationMetadata;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ customerId: 1, createdAt: -1 });
