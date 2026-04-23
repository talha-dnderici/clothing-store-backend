import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewCommentDto {
  @IsIn(['approved', 'rejected'])
  approvalStatus!: 'approved' | 'rejected';

  @IsString()
  reviewedBy!: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
