import { IsIn, IsString } from 'class-validator';

export class UpdateDeliveryStatusDto {
  @IsString()
  deliveryId!: string;

  @IsIn(['processing', 'in-transit', 'delivered'])
  status!: 'processing' | 'in-transit' | 'delivered';
}
