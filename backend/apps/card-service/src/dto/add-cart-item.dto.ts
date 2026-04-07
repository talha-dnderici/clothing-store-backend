import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  userId!: string;

  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  selectedSize?: string;

  @IsOptional()
  @IsString()
  selectedColor?: string;
}
