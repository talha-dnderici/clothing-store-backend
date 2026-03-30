import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type WishlistDocument = HydratedDocument<Wishlist>;

@Schema({ _id: false })
export class WishlistItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ default: false })
  discountNotified!: boolean;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);

@Schema({ timestamps: true, collection: 'wishlists' })
export class Wishlist {
  @Prop({ required: true, unique: true })
  customerId!: string;

  @Prop({ type: [WishlistItemSchema], default: [] })
  items!: WishlistItem[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
