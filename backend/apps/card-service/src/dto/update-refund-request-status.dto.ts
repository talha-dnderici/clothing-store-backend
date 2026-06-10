import { IsIn, IsOptional, IsString } from 'class-validator';
import { RefundRequestStatus } from '@app/common/database/schemas/refund-request.schema';

export class UpdateRefundRequestStatusDto {
  @IsString()
  id!: string;

  @IsIn(['approved', 'rejected', 'completed'])
  status!: Exclude<RefundRequestStatus, 'pending'>;

  @IsOptional()
  @IsString()
  decisionNote?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}
