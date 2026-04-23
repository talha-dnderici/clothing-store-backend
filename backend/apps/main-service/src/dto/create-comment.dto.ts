import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  productId!: string;

  @IsString()
  customerId!: string;

  @IsString()
  customerName!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
