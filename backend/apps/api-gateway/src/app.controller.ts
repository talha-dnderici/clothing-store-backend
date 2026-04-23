import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { IsIn, IsOptional, IsString } from 'class-validator';
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
import { AddCartItemDto } from '../../card-service/src/dto/add-cart-item.dto';
import { CartUserDto } from '../../card-service/src/dto/cart-user.dto';
import { CreateCardDto } from '../../card-service/src/dto/create-card.dto';
import { RemoveCartItemDto } from '../../card-service/src/dto/remove-cart-item.dto';
import { UpdateCartItemDto } from '../../card-service/src/dto/update-cart-item.dto';
import { UpdateCardDto } from '../../card-service/src/dto/update-card.dto';

class CheckoutRequestDto {
  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}

class UpdateOrderStatusRequestDto {
  @IsIn(['processing', 'in-transit', 'delivered'])
  status!: 'processing' | 'in-transit' | 'delivered';
}

type AuthenticatedUser = {
  sub: string;
  email: string;
  role: 'customer' | 'salesManager' | 'productManager';
};

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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    if (
      normalizedMessage.includes('validation') ||
      normalizedMessage.includes('required') ||
      normalizedMessage.includes('empty') ||
      normalizedMessage.includes('insufficient stock')
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getBearerToken(authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Authentication is required');
    }

    return token;
  }

  private async requireAuth(authorization?: string): Promise<AuthenticatedUser> {
    const token = this.getBearerToken(authorization);

    try {
      return await this.jwtService.verifyAsync<AuthenticatedUser>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'super-secret-key'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private requireProductManager(user: AuthenticatedUser) {
    if (user.role !== 'productManager') {
      throw new ForbiddenException('Product manager access is required');
    }
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

  @Get('cart/:userId')
  getActiveCart(@Param() params: CartUserDto) {
    return this.sendMessage(this.cardClient, 'card.getActiveCart', params);
  }

  @Post('cart/items')
  @HttpCode(HttpStatus.OK)
  addItemToCart(@Body() dto: AddCartItemDto) {
    return this.sendMessage(this.cardClient, 'card.addItemToCart', dto);
  }

  @Patch('cart/items')
  updateCartItem(@Body() dto: UpdateCartItemDto) {
    return this.sendMessage(this.cardClient, 'card.updateCartItem', dto);
  }

  @Delete('cart/items')
  removeCartItem(@Body() dto: RemoveCartItemDto) {
    return this.sendMessage(this.cardClient, 'card.removeCartItem', dto);
  }

  @Delete('cart/:userId')
  clearCart(@Param() params: CartUserDto) {
    return this.sendMessage(this.cardClient, 'card.clearCart', params);
  }

  @Post('orders/checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CheckoutRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    const user = await this.sendMessage<{
      id: string;
      email: string;
      address?: string;
    }>(this.registerClient, 'register.findOneUser', authUser.sub);
    const deliveryAddress = dto.deliveryAddress?.trim() || user.address?.trim();

    if (!deliveryAddress) {
      throw new BadRequestException('deliveryAddress is required');
    }

    return this.sendMessage(this.cardClient, 'card.checkout', {
      userId: authUser.sub,
      customerEmail: authUser.email,
      deliveryAddress,
      paymentConfirmed: true,
    });
  }

  @Get('orders')
  async findMyOrders(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const authUser = await this.requireAuth(authorization);
    return this.sendMessage(this.cardClient, 'card.findOrdersForUser', {
      userId: authUser.sub,
    });
  }

  @Get('orders/:id')
  async findOneOrder(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    const order = await this.sendMessage<{ customerId: string }>(
      this.cardClient,
      'card.findOneOrder',
      id,
    );

    if (order.customerId !== authUser.sub && authUser.role !== 'productManager') {
      throw new ForbiddenException('You cannot view this order');
    }

    return order;
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.cardClient, 'card.updateOrderStatus', {
      orderId: id,
      status: dto.status,
    });
  }

  @Get('deliveries')
  async findDeliveries(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.cardClient, 'card.findDeliveries', {});
  }

  @Patch('deliveries/:id/status')
  async updateDeliveryStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.cardClient, 'card.updateDeliveryStatus', {
      deliveryId: id,
      status: dto.status,
    });
  }

  @Get('deliveries/my')
  async findMyDeliveries(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const authUser = await this.requireAuth(authorization);
    return this.sendMessage(this.cardClient, 'card.findDeliveriesForUser', {
      userId: authUser.sub,
    });
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
