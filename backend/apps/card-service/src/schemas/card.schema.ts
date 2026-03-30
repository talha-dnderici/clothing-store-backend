import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CardDocument = HydratedDocument<Card>;

@Schema({ _id: false })
export class CardItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ default: '' })
  selectedSize!: string;

  @Prop({ default: '' })
  selectedColor!: string;
}

export const CardItemSchema = SchemaFactory.createForClass(CardItem);

@Schema({ timestamps: true, collection: 'cards' })
export class Card {
  @Prop({ required: true })
  userId!: string;

  @Prop({ type: [CardItemSchema], default: [] })
  items!: CardItem[];

  @Prop({
    type: String,
    enum: ['active', 'ordered', 'abandoned'],
    default: 'active',
  })
  status!: 'active' | 'ordered' | 'abandoned';
}

export const CardSchema = SchemaFactory.createForClass(Card);
