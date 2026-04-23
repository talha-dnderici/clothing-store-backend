import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  userId!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  deliveryAddress!: string;

  @IsOptional()
  @IsBoolean()
  paymentConfirmed?: boolean;
}
