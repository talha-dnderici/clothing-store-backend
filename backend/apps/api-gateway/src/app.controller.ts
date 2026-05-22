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
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
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

  @IsOptional()
  @IsString()
  paymentId?: string;
}

class MockPaymentRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
 
  @IsOptional()
  @IsString()
  orderId?: string;
}

class InvoiceQueryRequestDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}

class RevenueQueryRequestDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

class EmailInvoiceRequestDto {
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;
}

class UpdateOrderStatusRequestDto {
  @IsIn(['processing', 'in-transit', 'delivered'])
  status!: 'processing' | 'in-transit' | 'delivered';
}

class SubmitCommentRequestDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

class SubmitRatingRequestDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  content?: string;
}

class SubmitReviewRequestDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  content?: string;
}

class ReviewCommentRequestDto {
  @IsIn(['approved', 'rejected'])
  approvalStatus!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reviewNote?: string;
}

class UpdateStockRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  adjustment?: number;
}

class UpdateProductPricingRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @IsOptional()
  @IsBoolean()
  discountActive?: boolean;
}

class AddWishlistItemRequestDto {
  @IsString()
  productId!: string;
}

class ListNotificationsRequestDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

type AuthenticatedUser = {
  sub: string;
  email: string;
  role: 'customer' | 'salesManager' | 'productManager';
};

type AppRole = AuthenticatedUser['role'];

const MANAGER_ROLES: AppRole[] = ['salesManager', 'productManager'];
const SALES_MANAGER_ROLES: AppRole[] = ['salesManager'];
const PRODUCT_MANAGER_ROLES: AppRole[] = ['productManager'];

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

  private requireAnyRole(
    user: AuthenticatedUser,
    roles: AppRole[],
    message = 'You do not have access to this resource',
  ) {
    if (!roles.includes(user.role)) {
      throw new ForbiddenException(message);
    }
  }

  private requireCustomer(user: AuthenticatedUser) {
    this.requireAnyRole(user, ['customer'], 'Customer access is required');
  }

  private requireManager(user: AuthenticatedUser) {
    this.requireAnyRole(user, MANAGER_ROLES, 'Manager access is required');
  }

  private requireSalesManager(user: AuthenticatedUser) {
    this.requireAnyRole(
      user,
      SALES_MANAGER_ROLES,
      'Sales manager access is required',
    );
  }

  private requireProductManager(user: AuthenticatedUser) {
    this.requireAnyRole(
      user,
      PRODUCT_MANAGER_ROLES,
      'Product manager access is required',
    );
  }

  private assertSelf(user: AuthenticatedUser, ownerId: string, message: string) {
    if (user.sub !== ownerId) {
      throw new ForbiddenException(message);
    }
  }

  private assertSelfOrRoles(
    user: AuthenticatedUser,
    ownerId: string,
    roles: AppRole[],
    message: string,
  ) {
    if (user.sub === ownerId) {
      return;
    }

    this.requireAnyRole(user, roles, message);
  }

  private async getCustomerDisplayName(user: AuthenticatedUser) {
    try {
      const profile = await this.sendMessage<{ name?: string }>(
        this.registerClient,
        'register.findOneUser',
        user.sub,
      );

      return profile.name?.trim() || user.email.split('@')[0] || 'Customer';
    } catch {
      return user.email.split('@')[0] || 'Customer';
    }
  }

  @Get()
  getHealth() {
    return {
      service: 'api-gateway',
      message: 'Clothing store microservice backend is running',
    };
  }

  @Get('playground')
  getPlaygroundInfo() {
    return {
      frontend: 'http://localhost:3001/playground',
      mailInbox: 'http://localhost:8025',
      testUsers: {
        customer: 'customer@aura.test',
        salesManager: 'sales.manager@aura.test',
        productManager: 'product.manager@aura.test',
        password: 'password123',
      },
      flows: [
        'Submit a rating without approval',
        'Submit a comment without a rating and approve it as product manager',
        'Checkout and receive a PDF invoice email in Mailpit',
        'Update order status as product manager',
        'Update price and discount as sales manager',
      ],
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
  async createUser(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreateUserDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.registerClient, 'register.createUser', dto);
  }

  @Get('users')
  async findAllUsers(@Headers('authorization') authorization: string | undefined) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.registerClient, 'register.findAllUsers', {});
  }

  @Get('users/:id')
  async findOneUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.assertSelfOrRoles(
      authUser,
      id,
      MANAGER_ROLES,
      'You cannot view this user profile',
    );

    return this.sendMessage(this.registerClient, 'register.findOneUser', id);
  }

  @Patch('users/:id')
  async updateUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.assertSelfOrRoles(
      authUser,
      id,
      MANAGER_ROLES,
      'You cannot update this user profile',
    );

    return this.sendMessage(this.registerClient, 'register.updateUser', { id, dto });
  }

  @Delete('users/:id')
  async deleteUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.registerClient, 'register.deleteUser', id);
  }

  @Get('sessions')
  async findAllSessions(@Headers('authorization') authorization: string | undefined) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.loginClient, 'login.findAllSessions', {});
  }

  @Get('sessions/:id')
  async findOneSession(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.loginClient, 'login.findOneSession', id);
  }

  @Patch('sessions/:id')
  async updateSession(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.loginClient, 'login.updateSession', { id, dto });
  }

  @Delete('sessions/:id')
  async deleteSession(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.loginClient, 'login.deleteSession', id);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreateProductDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.createProduct', dto);
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreateCategoryDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

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

  @Post('products/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  async submitComment(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: SubmitCommentRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    const customerName = await this.getCustomerDisplayName(authUser);

    return this.sendMessage(this.mainClient, 'main.createComment', {
      productId: id,
      customerId: authUser.sub,
      customerName,
      content: dto.content,
      rating: dto.rating,
    });
  }

  @Post('products/:id/ratings')
  @HttpCode(HttpStatus.CREATED)
  async submitRating(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: SubmitRatingRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    const customerName = await this.getCustomerDisplayName(authUser);

    return this.sendMessage(this.mainClient, 'main.createRating', {
      productId: id,
      customerId: authUser.sub,
      customerName,
      rating: dto.rating,
      content: dto.content,
    });
  }

  @Post('products/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  async submitReview(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: SubmitReviewRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    const customerName = await this.getCustomerDisplayName(authUser);

    return this.sendMessage(this.mainClient, 'main.createRating', {
      productId: id,
      customerId: authUser.sub,
      customerName,
      rating: dto.rating,
      content: dto.content,
    });
  }

  @Get('products/:id/comments')
  findPublicComments(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.findPublicComments', id);
  }

  @Get('products/:id/ratings')
  findProductRatings(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.findProductRatings', id);
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.sendMessage(this.mainClient, 'main.findOneCategory', id);
  }

  @Patch('products/:id')
  async updateProduct(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.updateProduct', { id, dto });
  }

  @Get('wishlist')
  async findWishlist(@Headers('authorization') authorization: string | undefined) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);

    return this.sendMessage(this.mainClient, 'main.findWishlist', {
      customerId: authUser.sub,
    });
  }

  @Post('wishlist/items')
  @HttpCode(HttpStatus.OK)
  async addWishlistItem(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: AddWishlistItemRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);

    return this.sendMessage(this.mainClient, 'main.addWishlistItem', {
      customerId: authUser.sub,
      productId: dto.productId,
    });
  }

  @Delete('wishlist/items/:productId')
  async removeWishlistItem(
    @Headers('authorization') authorization: string | undefined,
    @Param('productId') productId: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);

    return this.sendMessage(this.mainClient, 'main.removeWishlistItem', {
      customerId: authUser.sub,
      productId,
    });
  }

  @Get('notifications')
  async findNotifications(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: ListNotificationsRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);

    return this.sendMessage(this.mainClient, 'main.findNotifications', {
      customerId: authUser.sub,
      unreadOnly: query.unreadOnly,
      limit: query.limit,
    });
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);

    return this.sendMessage(this.mainClient, 'main.markNotificationRead', {
      customerId: authUser.sub,
      notificationId: id,
    });
  }

  @Get('manager/comments')
  async findManagerComments(
    @Headers('authorization') authorization: string | undefined,
    @Query('status') status?: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.findCommentsForManager', {
      status,
    });
  }

  @Patch('manager/comments/:id')
  async reviewComment(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: ReviewCommentRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.reviewComment', {
      id,
      dto: {
        approvalStatus: dto.approvalStatus,
        reviewedBy: authUser.sub,
        reviewNote: dto.reviewNote,
      },
    });
  }

  @Patch('manager/products/:id/pricing')
  async updateProductPricing(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateProductPricingRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireSalesManager(authUser);

    return this.sendMessage(this.mainClient, 'main.updateProductPricing', {
      id,
      dto,
    });
  }

  @Patch('manager/products/:id/stock')
  async updateProductStock(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateStockRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.mainClient, 'main.updateStock', {
      id,
      dto,
    });
  }

  @Get('manager/products/low-stock')
  async findLowStockProducts(
    @Headers('authorization') authorization: string | undefined,
    @Query('threshold') threshold?: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    const parsedThreshold = threshold ? Number.parseInt(threshold, 10) : 5;
    return this.sendMessage(this.mainClient, 'main.findLowStock', {
      threshold: Number.isFinite(parsedThreshold) ? parsedThreshold : 5,
    });
  }

  @Patch('categories/:id')
  async updateCategory(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.updateCategory', { id, dto });
  }

  @Delete('products/:id')
  async deleteProduct(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.deleteProduct', id);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireProductManager(authUser);

    return this.sendMessage(this.mainClient, 'main.deleteCategory', id);
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  async createCard(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreateCardDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.cardClient, 'card.createCard', dto);
  }

  @Get('cart/:userId')
  async getActiveCart(
    @Headers('authorization') authorization: string | undefined,
    @Param() params: CartUserDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    this.assertSelf(authUser, params.userId, 'You can only view your own cart');

    return this.sendMessage(this.cardClient, 'card.getActiveCart', params);
  }

  @Post('cart/items')
  @HttpCode(HttpStatus.OK)
  async addItemToCart(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    this.assertSelf(authUser, dto.userId, 'You can only update your own cart');

    return this.sendMessage(this.cardClient, 'card.addItemToCart', dto);
  }

  @Patch('cart/items')
  async updateCartItem(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: UpdateCartItemDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    this.assertSelf(authUser, dto.userId, 'You can only update your own cart');

    return this.sendMessage(this.cardClient, 'card.updateCartItem', dto);
  }

  @Delete('cart/items')
  async removeCartItem(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: RemoveCartItemDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    this.assertSelf(authUser, dto.userId, 'You can only update your own cart');

    return this.sendMessage(this.cardClient, 'card.removeCartItem', dto);
  }

  @Delete('cart/:userId')
  async clearCart(
    @Headers('authorization') authorization: string | undefined,
    @Param() params: CartUserDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    this.assertSelf(authUser, params.userId, 'You can only clear your own cart');

    return this.sendMessage(this.cardClient, 'card.clearCart', params);
  }

  @Post('payments/mock')
  @HttpCode(HttpStatus.OK)
  async createMockPayment(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: MockPaymentRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);

    return this.sendMessage(this.cardClient, 'card.mockPayment', {
      userId: authUser.sub,
      amount: dto.amount,
      orderId: dto.orderId,
    });
  }

  @Post('orders/checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CheckoutRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    const user = await this.sendMessage<{
      id: string;
      email: string;
      address?: string;
    }>(this.registerClient, 'register.findOneUser', authUser.sub);
    const deliveryAddress = dto.deliveryAddress?.trim() || user.address?.trim();

    if (!deliveryAddress) {
      throw new BadRequestException('deliveryAddress is required');
    }

    let paymentId = dto.paymentId?.trim();
    if (!paymentId) {
      const mockPayment = await this.sendMessage<{ paymentId: string }>(
        this.cardClient,
        'card.mockPayment',
        { userId: authUser.sub },
      );
      paymentId = mockPayment.paymentId;
    }

    return this.sendMessage(this.cardClient, 'card.checkout', {
      userId: authUser.sub,
      customerEmail: authUser.email,
      deliveryAddress,
      paymentId,
    });
  }
  @Post('payments/mock')
  @HttpCode(HttpStatus.OK)
  async mockPayment(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: MockPaymentRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    return this.sendMessage(this.cardClient, 'card.mockPayment', {
      userId: authUser.sub,
      amount: dto.amount,
      orderId: dto.orderId,
    });
  }

  @Get('orders')
  async findMyOrders(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    return this.sendMessage(this.cardClient, 'card.findOrdersForUser', {
      userId: authUser.sub,
    });
  }

  @Get('manager/orders')
  async findManagerOrders(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.cardClient, 'card.findAllOrders', {});
  }

  @Get('manager/invoices')
  async findManagerInvoices(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: InvoiceQueryRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireSalesManager(authUser);

    return this.sendMessage(this.cardClient, 'card.findInvoices', query);
  }

  @Get('manager/revenue')
  async getManagerRevenueReport(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: RevenueQueryRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireSalesManager(authUser);

    return this.sendMessage(this.cardClient, 'card.getRevenueReport', query);
  }

  @Get('manager/profit-loss')
  async getManagerProfitLossReport(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: RevenueQueryRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireSalesManager(authUser);

    return this.sendMessage(this.cardClient, 'card.getProfitLossReport', query);
  }

  @Patch('manager/orders/:id/status')
  async updateManagerOrderStatus(
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

  @Get('manager/invoices/:orderId/pdf')
  async findManagerInvoicePdf(
    @Headers('authorization') authorization: string | undefined,
    @Param('orderId') orderId: string,
    @Res() res: any,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireSalesManager(authUser);

    const pdf = await this.sendMessage<{
      fileName: string;
      contentType: string;
      base64: string;
    }>(this.cardClient, 'card.findOrderInvoicePdf', orderId);

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.fileName}"`);
    return res.send(Buffer.from(pdf.base64, 'base64'));
  }

  @Post('manager/invoices/:orderId/email')
  async emailManagerInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Param('orderId') orderId: string,
    @Body() dto: EmailInvoiceRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireSalesManager(authUser);

    return this.sendMessage(this.cardClient, 'card.emailOrderInvoice', {
      orderId,
      recipientEmail: dto.recipientEmail,
    });
  }

  @Get('orders/status/my')
  async findMyOrderDeliveryStatus(
    @Headers('authorization') authorization: string | undefined,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireCustomer(authUser);
    return this.sendMessage(this.cardClient, 'card.findOrderDeliveryStatusForUser', {
      userId: authUser.sub,
    });
  }

  @Get('orders/:id/invoice')
  async findOrderInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    const order = await this.sendMessage<{ customerId: string }>(
      this.cardClient,
      'card.findOneOrder',
      id,
    );

    this.assertSelfOrRoles(
      authUser,
      order.customerId,
      SALES_MANAGER_ROLES,
      'You cannot view this invoice',
    );

    return this.sendMessage(this.cardClient, 'card.findOrderInvoice', id);
  }

  @Get('orders/:id/invoice/pdf')
  async findOrderInvoicePdf(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Res() res: any,
  ) {
    const authUser = await this.requireAuth(authorization);
    const order = await this.sendMessage<{ customerId: string }>(
      this.cardClient,
      'card.findOneOrder',
      id,
    );

    this.assertSelfOrRoles(
      authUser,
      order.customerId,
      SALES_MANAGER_ROLES,
      'You cannot view this invoice PDF',
    );

    const pdf = await this.sendMessage<{
      fileName: string;
      contentType: string;
      base64: string;
    }>(this.cardClient, 'card.findOrderInvoicePdf', id);

    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    return res.send(Buffer.from(pdf.base64, 'base64'));
  }

  @Post('orders/:id/invoice/email')
  async emailOrderInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: EmailInvoiceRequestDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    const order = await this.sendMessage<{ customerId: string }>(
      this.cardClient,
      'card.findOneOrder',
      id,
    );

    this.assertSelfOrRoles(
      authUser,
      order.customerId,
      SALES_MANAGER_ROLES,
      'You cannot email this invoice',
    );

    return this.sendMessage(this.cardClient, 'card.emailOrderInvoice', {
      orderId: id,
      recipientEmail: dto.recipientEmail,
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

    this.assertSelfOrRoles(
      authUser,
      order.customerId,
      MANAGER_ROLES,
      'You cannot view this order',
    );

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
    this.requireCustomer(authUser);
    return this.sendMessage(this.cardClient, 'card.findDeliveriesForUser', {
      userId: authUser.sub,
    });
  }

  @Get('cards')
  async findAllCards(@Headers('authorization') authorization: string | undefined) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.cardClient, 'card.findAllCards', {});
  }

  @Get('cards/:id')
  async findOneCard(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.cardClient, 'card.findOneCard', id);
  }

  @Patch('cards/:id')
  async updateCard(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.cardClient, 'card.updateCard', { id, dto });
  }

  @Delete('cards/:id')
  async deleteCard(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const authUser = await this.requireAuth(authorization);
    this.requireManager(authUser);

    return this.sendMessage(this.cardClient, 'card.deleteCard', id);
  }
}
