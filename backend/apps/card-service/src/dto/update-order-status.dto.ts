import { IsIn, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  orderId!: string;

  @IsIn(['processing', 'in-transit', 'delivered', 'cancelled', 'refunded'])
  status!: 'processing' | 'in-transit' | 'delivered' | 'cancelled' | 'refunded';
}
