import { IsString } from 'class-validator';

export class CartUserDto {
  @IsString()
  userId!: string;
}
