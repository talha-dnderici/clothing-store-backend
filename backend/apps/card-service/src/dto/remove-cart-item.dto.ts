import { IsOptional, IsString } from 'class-validator';

export class RemoveCartItemDto {
  @IsString()
  userId!: string;

  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  selectedSize?: string;

  @IsOptional()
  @IsString()
  selectedColor?: string;
}
