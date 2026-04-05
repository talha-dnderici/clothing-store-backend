import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListProductsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsIn(['latest', 'price_asc', 'price_desc', 'popularity'])
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'popularity';
}
