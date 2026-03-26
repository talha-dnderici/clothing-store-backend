import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { SERVICE_TOKENS } from '@app/common/constants/service-tokens';
import { LoginDto } from './dto/login.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { LoginSession, LoginSessionDocument } from './schemas/login-session.schema';

@Injectable()
export class LoginService {
  constructor(
    @InjectModel(LoginSession.name)
    private readonly loginSessionModel: Model<LoginSessionDocument>,
    @Inject(SERVICE_TOKENS.REGISTER)
    private readonly registerClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private handleServiceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(fallbackMessage);
  }

  private sanitizeSession(session: LoginSessionDocument) {
    const object = session.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  // The login flow delegates user storage concerns to the register service.
  // This keeps the architecture separated and avoids storing the same user twice.
  async login(payload: LoginDto) {
    try {
      const user = await firstValueFrom(
        this.registerClient.send('register.findUserByEmail', {
          email: payload.email,
        }),
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(payload.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Password is incorrect');
      }

      const token = await this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET', 'super-secret-key'),
          expiresIn: '7d',
        },
      );

      const session = await this.loginSessionModel.create({
        userId: user.id,
        email: user.email,
        token,
        isActive: true,
      });

      return {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        session: this.sanitizeSession(session),
      };
    } catch (error) {
      this.handleServiceError(error, 'Login could not be completed');
    }
  }

  async findAllSessions() {
    try {
      const sessions = await this.loginSessionModel.find().sort({ createdAt: -1 }).exec();
      return sessions.map((session) => this.sanitizeSession(session));
    } catch (error) {
      this.handleServiceError(error, 'Sessions could not be listed');
    }
  }

  async findOneSession(id: string) {
    try {
      const session = await this.loginSessionModel.findById(id).exec();

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      return this.sanitizeSession(session);
    } catch (error) {
      this.handleServiceError(error, 'Session could not be fetched');
    }
  }

  async updateSession(id: string, payload: UpdateSessionDto) {
    try {
      const session = await this.loginSessionModel
        .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        .exec();

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      return this.sanitizeSession(session);
    } catch (error) {
      this.handleServiceError(error, 'Session could not be updated');
    }
  }

  async deleteSession(id: string) {
    try {
      const session = await this.loginSessionModel.findByIdAndDelete(id).exec();

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.handleServiceError(error, 'Session could not be deleted');
    }
  }
}
