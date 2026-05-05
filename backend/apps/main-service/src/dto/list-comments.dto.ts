import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListCommentsDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}
