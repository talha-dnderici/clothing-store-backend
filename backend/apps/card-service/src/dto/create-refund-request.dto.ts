import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRefundRequestDto {
  @IsString()
  customerId!: string;

  @IsString()
  orderId!: string;

  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
