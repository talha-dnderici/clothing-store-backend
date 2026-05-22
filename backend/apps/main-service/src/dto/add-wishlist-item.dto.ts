import { IsString } from 'class-validator';

export class AddWishlistItemDto {
  @IsString()
  customerId!: string;

  @IsString()
  productId!: string;
}
