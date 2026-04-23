import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  userId!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  deliveryAddress!: string;
}
