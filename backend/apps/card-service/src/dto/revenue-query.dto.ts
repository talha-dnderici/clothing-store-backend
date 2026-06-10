import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class RevenueQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}
