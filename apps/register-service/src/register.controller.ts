import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterService } from './register.service';

@Controller()
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @MessagePattern('register.registerUser')
  registerUser(@Payload() payload: RegisterUserDto) {
    return this.registerService.registerUser(payload);
  }

  @MessagePattern('register.createUser')
  createUser(@Payload() payload: CreateUserDto) {
    return this.registerService.createUser(payload);
  }

  @MessagePattern('register.findAllUsers')
  findAllUsers() {
    return this.registerService.findAllUsers();
  }

  @MessagePattern('register.findOneUser')
  findOneUser(@Payload() id: string) {
    return this.registerService.findOneUser(id);
  }

  @MessagePattern('register.findUserByEmail')
  findUserByEmail(@Payload() payload: FindUserByEmailDto) {
    return this.registerService.findUserByEmail(payload);
  }

  @MessagePattern('register.updateUser')
  updateUser(@Payload() payload: { id: string; dto: UpdateUserDto }) {
    return this.registerService.updateUser(payload.id, payload.dto);
  }

  @MessagePattern('register.deleteUser')
  deleteUser(@Payload() id: string) {
    return this.registerService.deleteUser(id);
  }
}
