import { IsIn, IsOptional, IsString } from 'class-validator';
import { RefundRequestStatus } from '@app/common/database/schemas/refund-request.schema';

export class ListRefundRequestsDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'completed'])
  status?: RefundRequestStatus;
}
