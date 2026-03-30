import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { LoginService } from './login.service';

@Controller()
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @MessagePattern('login.authenticate')
  authenticate(@Payload() payload: LoginDto) {
    return this.loginService.login(payload);
  }

  @MessagePattern('login.findAllSessions')
  findAllSessions() {
    return this.loginService.findAllSessions();
  }

  @MessagePattern('login.findOneSession')
  findOneSession(@Payload() id: string) {
    return this.loginService.findOneSession(id);
  }

  @MessagePattern('login.updateSession')
  updateSession(@Payload() payload: { id: string; dto: UpdateSessionDto }) {
    return this.loginService.updateSession(payload.id, payload.dto);
  }

  @MessagePattern('login.deleteSession')
  deleteSession(@Payload() id: string) {
    return this.loginService.deleteSession(id);
  }
}
