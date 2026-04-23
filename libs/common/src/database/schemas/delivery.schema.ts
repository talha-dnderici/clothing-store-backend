import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type DeliveryDocument = HydratedDocument<Delivery>;

@Schema({ timestamps: true, collection: 'deliveries' })
export class Delivery {
  @Prop({ required: true, unique: true, trim: true })
  deliveryId!: string;

  @Prop({ required: true, trim: true })
  orderId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true, trim: true })
  productName!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  totalPrice!: number;

  @Prop({ required: true, trim: true })
  deliveryAddress!: string;

  @Prop({
    type: String,
    enum: ['processing', 'in-transit', 'delivered'],
    default: 'processing',
  })
  status!: 'processing' | 'in-transit' | 'delivered';

  @Prop({ default: false })
  completed!: boolean;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
