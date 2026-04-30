import { IsIn, IsString } from 'class-validator';

export class UpdateCommentApprovalDto {
  @IsString()
  commentId!: string;

  @IsIn(['approved', 'rejected'])
  approvalStatus!: 'approved' | 'rejected';

  @IsString()
  reviewedBy!: string;
}
