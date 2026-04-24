import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * SCRUM Req-12: Product Manager stock management DTO.
 * Supports either absolute set (stock) or relative delta (adjustment).
 */
export class UpdateStockDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  adjustment?: number;
}
