import { IsString } from 'class-validator';

export class OrderIdDto {
  @IsString()
  orderId!: string;
}
