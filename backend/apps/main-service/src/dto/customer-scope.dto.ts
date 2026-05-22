import { IsString } from 'class-validator';

export class CustomerScopeDto {
  @IsString()
  customerId!: string;
}
