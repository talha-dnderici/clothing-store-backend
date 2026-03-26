import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class RegisterUserDto extends PickType(CreateUserDto, [
  'name',
  'email',
  'password',
  'taxId',
  'address',
] as const) {}
