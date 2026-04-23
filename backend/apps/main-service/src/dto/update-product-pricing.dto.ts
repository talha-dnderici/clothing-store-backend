import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateProductPricingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @IsOptional()
  @IsBoolean()
  discountActive?: boolean;
}
