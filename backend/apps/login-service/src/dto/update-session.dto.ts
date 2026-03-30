import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
