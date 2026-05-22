import { IsString } from 'class-validator';

export class RemoveWishlistItemDto {
  @IsString()
  customerId!: string;

  @IsString()
  productId!: string;
}
