import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { Card, CardDocument } from './schemas/card.schema';
import {
  Product,
  ProductDocument,
} from '../../main-service/src/schemas/product.schema';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private handleServiceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string | string[] })?.message ?? error.message;

      throw new RpcException({
        statusCode: error.getStatus(),
        message,
      });
    }

    throw new RpcException(
      new InternalServerErrorException(fallbackMessage).getResponse(),
    );
  }

  private sanitizeCard(card: CardDocument) {
    const object = card.toObject();
    return {
      id: object._id.toString(),
      totalItems: object.items.reduce((sum, item) => sum + item.quantity, 0),
      ...object,
    };
  }

  private normalizeItemText(value?: string) {
    return value?.trim() ?? '';
  }

  private isSameItem(
    left: { productId: string; selectedSize?: string; selectedColor?: string },
    right: { productId: string; selectedSize?: string; selectedColor?: string },
  ) {
    return (
      left.productId === right.productId &&
      this.normalizeItemText(left.selectedSize) ===
        this.normalizeItemText(right.selectedSize) &&
      this.normalizeItemText(left.selectedColor) ===
        this.normalizeItemText(right.selectedColor)
    );
  }

  private async ensureItemsInStock(
    items: Array<{
      productId: string;
      quantity: number;
      selectedSize?: string;
      selectedColor?: string;
    }>,
  ) {
    const requestedByProduct = new Map<string, number>();

    for (const item of items) {
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const productIds = [...requestedByProduct.keys()];

    if (!productIds.length) {
      return;
    }

    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('_id stock')
      .lean()
      .exec();

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product.stock]),
    );

    for (const [productId, requestedQuantity] of requestedByProduct.entries()) {
      const stock = productMap.get(productId);

      if (stock === undefined) {
        throw new NotFoundException(`Product not found: ${productId}`);
      }

      if (requestedQuantity > stock) {
        throw new BadRequestException(
          `Insufficient stock for product ${productId}. Available stock: ${stock}`,
        );
      }
    }
  }

  private async getOrCreateActiveCard(userId: string) {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      throw new BadRequestException('userId is required');
    }

    const existingCard = await this.cardModel
      .findOne({ userId: normalizedUserId, status: 'active' })
      .exec();

    if (existingCard) {
      return existingCard;
    }

    try {
      return await this.cardModel.create({
        userId: normalizedUserId,
        items: [],
        status: 'active',
      });
    } catch (error) {
      const duplicateKeyError = error as { code?: number };

      if (duplicateKeyError?.code === 11000) {
        const activeCard = await this.cardModel
          .findOne({ userId: normalizedUserId, status: 'active' })
          .exec();

        if (activeCard) {
          return activeCard;
        }
      }

      this.handleServiceError(error, 'Active card could not be created');
    }
  }

  // The card service stores only references and shopping preferences.
  // Product details stay in the main service to prevent unnecessary duplication.
  async createCard(payload: CreateCardDto) {
    try {
      await this.ensureItemsInStock(payload.items);
      const card = await this.cardModel.create({
        ...payload,
        status: payload.status ?? 'active',
      });

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Card could not be created');
    }
  }

  async findAllCards() {
    try {
      const cards = await this.cardModel.find().sort({ createdAt: -1 }).exec();
      return cards.map((card) => this.sanitizeCard(card));
    } catch (error) {
      this.handleServiceError(error, 'Cards could not be listed');
    }
  }

  async findOneCard(id: string) {
    try {
      const card = await this.cardModel.findById(id).exec();

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Card could not be fetched');
    }
  }

  async updateCard(id: string, payload: UpdateCardDto) {
    try {
      const currentCard = await this.cardModel.findById(id).exec();

      if (!currentCard) {
        throw new NotFoundException('Card not found');
      }

      const nextItems = payload.items ?? currentCard.items;
      await this.ensureItemsInStock(nextItems);

      const card = await this.cardModel
        .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        .exec();

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Card could not be updated');
    }
  }

  async getActiveCart(userId: string) {
    try {
      const card = await this.getOrCreateActiveCard(userId);
      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Active cart could not be fetched');
    }
  }

  async addItemToCart(payload: AddCartItemDto) {
    try {
      const card = await this.getOrCreateActiveCard(payload.userId);
      const normalizedItem = {
        productId: payload.productId,
        quantity: payload.quantity,
        selectedSize: this.normalizeItemText(payload.selectedSize),
        selectedColor: this.normalizeItemText(payload.selectedColor),
      };

      const currentItems = card.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: this.normalizeItemText(item.selectedSize),
        selectedColor: this.normalizeItemText(item.selectedColor),
      }));

      const existingItem = currentItems.find((item) =>
        this.isSameItem(item, normalizedItem),
      );

      const nextItems = existingItem
        ? currentItems.map((item) =>
            this.isSameItem(item, normalizedItem)
              ? { ...item, quantity: item.quantity + normalizedItem.quantity }
              : item,
          )
        : [...currentItems, normalizedItem];

      await this.ensureItemsInStock(nextItems);

      card.items = nextItems;
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Item could not be added to cart');
    }
  }

  async updateCartItem(payload: UpdateCartItemDto) {
    try {
      const card = await this.getOrCreateActiveCard(payload.userId);
      const normalizedTarget = {
        productId: payload.productId,
        selectedSize: this.normalizeItemText(payload.selectedSize),
        selectedColor: this.normalizeItemText(payload.selectedColor),
      };

      const currentItems = card.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: this.normalizeItemText(item.selectedSize),
        selectedColor: this.normalizeItemText(item.selectedColor),
      }));

      const itemExists = currentItems.some((item) =>
        this.isSameItem(item, normalizedTarget),
      );

      if (!itemExists) {
        throw new NotFoundException('Cart item not found');
      }

      const nextItems = currentItems.map((item) =>
        this.isSameItem(item, normalizedTarget)
          ? { ...item, quantity: payload.quantity }
          : item,
      );

      await this.ensureItemsInStock(nextItems);

      card.items = nextItems;
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Cart item could not be updated');
    }
  }

  async removeCartItem(payload: RemoveCartItemDto) {
    try {
      const card = await this.getOrCreateActiveCard(payload.userId);
      const normalizedTarget = {
        productId: payload.productId,
        selectedSize: this.normalizeItemText(payload.selectedSize),
        selectedColor: this.normalizeItemText(payload.selectedColor),
      };

      const currentItems = card.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: this.normalizeItemText(item.selectedSize),
        selectedColor: this.normalizeItemText(item.selectedColor),
      }));

      const nextItems = currentItems.filter(
        (item) => !this.isSameItem(item, normalizedTarget),
      );

      if (nextItems.length === currentItems.length) {
        throw new NotFoundException('Cart item not found');
      }

      card.items = nextItems;
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Cart item could not be removed');
    }
  }

  async clearCart(userId: string) {
    try {
      const card = await this.getOrCreateActiveCard(userId);
      card.items = [];
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Cart could not be cleared');
    }
  }

  async deleteCard(id: string) {
    try {
      const card = await this.cardModel.findByIdAndDelete(id).exec();

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.handleServiceError(error, 'Card could not be deleted');
    }
  }
}
