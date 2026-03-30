import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class RegisterService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private handleServiceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(fallbackMessage);
  }

  private sanitizeUser(user: UserDocument) {
    const object = user.toObject();
    const { password, ...safeUser } = object;
    return {
      id: safeUser._id.toString(),
      ...safeUser,
    };
  }

  private sanitizeUserWithPassword(user: UserDocument) {
    const object = user.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Registration is intentionally small and focused:
  // it always creates a customer profile with the minimum required fields.
  async registerUser(payload: RegisterUserDto) {
    try {
      const existingUser = await this.userModel.findOne({ email: payload.email }).exec();

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const createdUser = await this.userModel.create({
        ...payload,
        role: 'customer',
        password: await this.hashPassword(payload.password),
      });

      return this.sanitizeUser(createdUser);
    } catch (error) {
      this.handleServiceError(error, 'Customer registration could not be completed');
    }
  }

  // This CRUD endpoint is broader than registration and can be used by admins.
  async createUser(payload: CreateUserDto) {
    try {
      const existingUser = await this.userModel.findOne({ email: payload.email }).exec();

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const createdUser = await this.userModel.create({
        ...payload,
        role: payload.role ?? 'customer',
        password: await this.hashPassword(payload.password),
      });

      return this.sanitizeUser(createdUser);
    } catch (error) {
      this.handleServiceError(error, 'User could not be created');
    }
  }

  async findAllUsers() {
    try {
      const users = await this.userModel.find().sort({ createdAt: -1 }).exec();
      return users.map((user) => this.sanitizeUser(user));
    } catch (error) {
      this.handleServiceError(error, 'Users could not be listed');
    }
  }

  async findOneUser(id: string) {
    try {
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      this.handleServiceError(error, 'User could not be fetched');
    }
  }

  // The login service uses this internal method to retrieve the password hash
  // without duplicating user data in another database or service.
  async findUserByEmail(payload: FindUserByEmailDto) {
    try {
      const user = await this.userModel.findOne({ email: payload.email }).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.sanitizeUserWithPassword(user);
    } catch (error) {
      this.handleServiceError(error, 'User lookup could not be completed');
    }
  }

  async updateUser(id: string, payload: UpdateUserDto) {
    try {
      const updatePayload = { ...payload } as UpdateUserDto;

      if (payload.password) {
        updatePayload.password = await this.hashPassword(payload.password);
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updatePayload, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      this.handleServiceError(error, 'User could not be updated');
    }
  }

  async deleteUser(id: string) {
    try {
      const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

      if (!deletedUser) {
        throw new NotFoundException('User not found');
      }

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.handleServiceError(error, 'User could not be deleted');
    }
  }
}
