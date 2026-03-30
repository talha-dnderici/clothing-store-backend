import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true, trim: true })
  productName!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountRate!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  customerEmail!: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ required: true, trim: true })
  deliveryAddress!: string;

  @Prop({
    type: String,
    enum: ['processing', 'in-transit', 'delivered', 'cancelled', 'refunded'],
    default: 'processing',
  })
  status!: 'processing' | 'in-transit' | 'delivered' | 'cancelled' | 'refunded';

  @Prop({ required: true, min: 0 })
  totalPrice!: number;

  @Prop({ default: false })
  paymentConfirmed!: boolean;

  @Prop({ default: '' })
  invoiceId!: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
