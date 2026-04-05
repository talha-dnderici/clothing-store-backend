import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICE_TOKENS } from '@app/common/constants/service-tokens';
import { LoginDto } from '../../login-service/src/dto/login.dto';
import { UpdateSessionDto } from '../../login-service/src/dto/update-session.dto';
import { CreateCategoryDto } from '../../main-service/src/dto/create-category.dto';
import { CreateUserDto } from '../../register-service/src/dto/create-user.dto';
import { RegisterUserDto } from '../../register-service/src/dto/register-user.dto';
import { UpdateUserDto } from '../../register-service/src/dto/update-user.dto';
import { CreateProductDto } from '../../main-service/src/dto/create-product.dto';
import { ListProductsDto } from '../../main-service/src/dto/list-products.dto';
import { UpdateCategoryDto } from '../../main-service/src/dto/update-category.dto';
import { UpdateProductDto } from '../../main-service/src/dto/update-product.dto';
import { CreateCardDto } from '../../card-service/src/dto/create-card.dto';
import { UpdateCardDto } from '../../card-service/src/dto/update-card.dto';

@Controller()
export class AppController {
  constructor(
    @Inject(SERVICE_TOKENS.LOGIN)
    private readonly loginClient: ClientProxy,
    @Inject(SERVICE_TOKENS.REGISTER)
    private readonly registerClient: ClientProxy,
    @Inject(SERVICE_TOKENS.MAIN)
    private readonly mainClient: ClientProxy,
    @Inject(SERVICE_TOKENS.CARD)
    private readonly cardClient: ClientProxy,
  ) {}

  private async sendMessage<T>(
    client: ClientProxy,
    pattern: string,
    payload: unknown,
  ): Promise<T> {
    try {
      return await firstValueFrom(client.send<T>(pattern, payload));
    } catch (error) {
      const details = this.extractErrorDetails(error);

      throw new HttpException(
        {
          success: false,
          statusCode: details.statusCode,
          message: details.message,
        },
        details.statusCode,
      );
    }
  }

  private extractErrorDetails(error: unknown) {
    const candidate = error as
      | {
          message?: string | string[];
          status?: number | string;
          statusCode?: number;
          error?: unknown;
        }
      | undefined;

    const message = Array.isArray(candidate?.message)
      ? candidate?.message.join(', ')
      : candidate?.message || 'Unexpected service error';
    const statusCode =
      candidate?.statusCode ||
      (typeof candidate?.status === 'number'
        ? candidate.status
        : this.mapMessageToStatusCode(message));

    return {
      message,
      statusCode,
    };
  }

  private mapMessageToStatusCode(message: string) {
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('password is incorrect') ||
      normalizedMessage.includes('invalid email or password') ||
      normalizedMessage.includes('unauthorized')
    ) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (normalizedMessage.includes('already exists')) {
      return HttpStatus.CONFLICT;
    }

    if (normalizedMessage.includes('not found')) {
      return HttpStatus.NOT_FOUND;
    }

    if (normalizedMessage.includes('validation')) {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  @Get()
  getHealth() {
    return {
      service: 'api-gateway',
      message: 'Clothing store microservice backend is running',
    };
  }

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterUserDto) {
    return this.sendMessage(this.registerClient, 'register.registerUser', dto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.sendMessage(this.loginClient, 'login.authenticate', dto);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() dto: CreateUserDto) {
    return this.sendMessage(this.registerClient, 'register.createUser', dto);
  }

  @Get('users')
  findAllUsers() {
    return this.sendMessage(this.registerClient, 'register.findAllUsers', {});
  }

  @Get('users/:id')
  findOneUser(@Param('id') id: string) {
    return this.sendMessage(this.registerClient, 'register.findOneUser', id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.sendMessage(this.registerClient, 'register.updateUser', { id, dto });
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.sendMessage(this.registerClient, 'register.deleteUser', id);
  }

  @Get('sessions')
  findAllSessions() {
    return this.sendMessage(this.loginClient, 'login.findAllSessions', {});
  }

  @Get('sessions/:id')
  findOneSession(@Param('id') id: string) {
    return this.sendMessage(this.loginClient, 'login.findOneSession', id);
  }

  @Patch('sessions/:id')
  updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sendMessage(this.loginClient, 'login.updateSession', { id, dto });
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string) {
    return this.sendMessage(this.loginClient, 'login.deleteSession', id);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Body() dto: CreateProductDto) {
    return this.sendMessage(this.mainClient, 'main.createProduct', dto);
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.sendMessage(this.mainClient, 'main.createCategory', dto);
  }

  @Get('products')
  findAllProducts(@Query() query: ListProductsDto) {
    return this.sendMessage(this.mainClient, 'main.findAllProducts', query);
  }

  @Get('categories')
  findAllCategories() {
    return this.sendMessage(this.mainClient, 'main.findAllCategories', {});
  }

  @Get('products/:id')
  findOneProduct(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.findOneProduct', id);
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.findOneCategory', id);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.sendMessage(this.mainClient, 'main.updateProduct', { id, dto });
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.sendMessage(this.mainClient, 'main.updateCategory', { id, dto });
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.deleteProduct', id);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.deleteCategory', id);
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  createCard(@Body() dto: CreateCardDto) {
    return this.sendMessage(this.cardClient, 'card.createCard', dto);
  }

  @Get('cards')
  findAllCards() {
    return this.sendMessage(this.cardClient, 'card.findAllCards', {});
  }

  @Get('cards/:id')
  findOneCard(@Param('id') id: string) {
    return this.sendMessage(this.cardClient, 'card.findOneCard', id);
  }

  @Patch('cards/:id')
  updateCard(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.sendMessage(this.cardClient, 'card.updateCard', { id, dto });
  }

  @Delete('cards/:id')
  deleteCard(@Param('id') id: string) {
    return this.sendMessage(this.cardClient, 'card.deleteCard', id);
  }
}
