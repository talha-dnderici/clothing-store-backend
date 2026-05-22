import { IsString } from 'class-validator';

export class MarkNotificationReadDto {
  @IsString()
  customerId!: string;

  @IsString()
  notificationId!: string;
}
