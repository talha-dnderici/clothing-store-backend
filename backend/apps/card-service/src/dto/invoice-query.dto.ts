import { IsDateString, IsOptional, IsString } from 'class-validator';

export class InvoiceQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}
