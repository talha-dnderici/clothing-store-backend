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
import {
  Delivery,
  DeliveryDocument,
} from '@app/common/database/schemas/delivery.schema';
import { Order, OrderDocument } from '@app/common/database/schemas/order.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Delivery.name)
    private readonly deliveryModel: Model<DeliveryDocument>,
  ) {}

  private readonly deliveryStatusOrder = ['processing', 'in-transit', 'delivered'] as const;

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

  private sanitizeOrder(order: OrderDocument) {
    const object = order.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  private sanitizeDelivery(delivery: DeliveryDocument) {
    const object = delivery.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  private normalizeItemText(value?: string) {
    return value?.trim() ?? '';
  }

  private assertValidDeliveryTransition(
    currentStatus: string,
    nextStatus: 'processing' | 'in-transit' | 'delivered',
  ) {
    const currentIndex = this.deliveryStatusOrder.findIndex(
      (status) => status === currentStatus,
    );
    const nextIndex = this.deliveryStatusOrder.indexOf(nextStatus);

    if (nextIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Invalid delivery status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private getOrderStatusFromDeliveries(
    deliveries: Array<{ status: 'processing' | 'in-transit' | 'delivered' }>,
  ) {
    if (deliveries.every((delivery) => delivery.status === 'delivered')) {
      return 'delivered';
    }

    if (deliveries.some((delivery) => delivery.status === 'in-transit')) {
      return 'in-transit';
    }

    return 'processing';
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

  async checkout(payload: CheckoutDto) {
    const decrementedStock: Array<{ productId: string; quantity: number }> = [];
    let createdOrder: OrderDocument | null = null;
    let claimedCard: CardDocument | null = null;

    try {
      const userId = payload.userId.trim();
      const deliveryAddress = payload.deliveryAddress.trim();

      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      if (!deliveryAddress) {
        throw new BadRequestException('deliveryAddress is required');
      }

      if (payload.paymentConfirmed !== true) {
        throw new BadRequestException('Payment must be confirmed before checkout');
      }

      const card = await this.cardModel
        .findOneAndUpdate(
          { userId, status: 'active', items: { $ne: [] } },
          { status: 'ordered' },
          { new: true, runValidators: true },
        )
        .exec();

      if (!card || !card.items.length) {
        throw new BadRequestException('Active cart is empty');
      }

      claimedCard = card;

      const requestedByProduct = new Map<string, number>();
      for (const item of card.items) {
        requestedByProduct.set(
          item.productId,
          (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productIds = [...requestedByProduct.keys()];
      const products = await this.productModel
        .find({ _id: { $in: productIds } })
        .exec();

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products were not found');
      }

      const productMap = new Map(
        products.map((product) => [product._id.toString(), product]),
      );

      for (const [productId, quantity] of requestedByProduct.entries()) {
        const product = productMap.get(productId);

        if (!product) {
          throw new NotFoundException(`Product not found: ${productId}`);
        }

        if (product.stock < quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}. Available stock: ${product.stock}`,
          );
        }
      }

      for (const [productId, quantity] of requestedByProduct.entries()) {
        const result = await this.productModel
          .updateOne(
            { _id: productId, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
          )
          .exec();

        if (result.modifiedCount !== 1) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}`,
          );
        }

        decrementedStock.push({ productId, quantity });
      }

      const orderItems = card.items.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }

        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          discountRate: product.discountRate ?? 0,
        };
      });

      const totalPrice = orderItems.reduce((sum, item) => {
        const discountMultiplier = 1 - item.discountRate / 100;
        return sum + item.unitPrice * item.quantity * discountMultiplier;
      }, 0);

      createdOrder = await this.orderModel.create({
        customerId: userId,
        customerEmail: payload.customerEmail,
        items: orderItems,
        deliveryAddress,
        status: 'processing',
        totalPrice: Math.round(totalPrice * 100) / 100,
        paymentConfirmed: true,
      });

      await this.deliveryModel.insertMany(
        orderItems.map((item, index) => ({
          deliveryId: `${createdOrder!._id.toString()}-${index + 1}`,
          orderId: createdOrder!._id.toString(),
          customerId: userId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          totalPrice:
            Math.round(
              item.unitPrice *
                item.quantity *
                (1 - item.discountRate / 100) *
                100,
            ) / 100,
          deliveryAddress,
          status: 'processing',
          completed: false,
        })),
      );

      return {
        order: this.sanitizeOrder(createdOrder),
        deliveryStatus: 'processing',
      };
    } catch (error) {
      if (claimedCard && !createdOrder) {
        await this.cardModel
          .updateOne({ _id: claimedCard._id }, { status: 'active' })
          .exec();
      }

      await Promise.all(
        decrementedStock.map((item) =>
          this.productModel
            .updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity } },
            )
            .exec(),
        ),
      );

      if (createdOrder) {
        await this.deliveryModel
          .deleteMany({ orderId: createdOrder._id.toString() })
          .exec();
        await this.orderModel.deleteOne({ _id: createdOrder._id }).exec();

        if (claimedCard) {
          await this.cardModel
            .updateOne({ _id: claimedCard._id }, { status: 'active' })
            .exec();
        }
      }

      this.handleServiceError(error, 'Checkout could not be completed');
    }
  }

  async findOrdersForUser(userId: string) {
    try {
      const orders = await this.orderModel
        .find({ customerId: userId.trim() })
        .sort({ createdAt: -1 })
        .exec();

      return orders.map((order) => this.sanitizeOrder(order));
    } catch (error) {
      this.handleServiceError(error, 'Orders could not be listed');
    }
  }

  async findOneOrder(id: string) {
    try {
      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return this.sanitizeOrder(order);
    } catch (error) {
      this.handleServiceError(error, 'Order could not be fetched');
    }
  }

  async updateOrderStatus(payload: UpdateOrderStatusDto) {
    try {
      const order = await this.orderModel.findById(payload.orderId).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      this.assertValidDeliveryTransition(order.status, payload.status);

      order.status = payload.status;
      await order.save();

      const completed = payload.status === 'delivered';
      await this.deliveryModel
        .updateMany(
          { orderId: payload.orderId },
          { status: payload.status, completed },
          { runValidators: true },
        )
        .exec();

      return this.sanitizeOrder(order);
    } catch (error) {
      this.handleServiceError(error, 'Order status could not be updated');
    }
  }

  async updateDeliveryStatus(payload: UpdateDeliveryStatusDto) {
    try {
      const delivery = await this.deliveryModel
        .findOne({ deliveryId: payload.deliveryId })
        .exec();

      if (!delivery) {
        throw new NotFoundException('Delivery not found');
      }

      this.assertValidDeliveryTransition(delivery.status, payload.status);

      delivery.status = payload.status;
      delivery.completed = payload.status === 'delivered';
      await delivery.save();

      const deliveriesForOrder = await this.deliveryModel
        .find({ orderId: delivery.orderId })
        .select('status')
        .lean()
        .exec();
      const orderStatus = this.getOrderStatusFromDeliveries(deliveriesForOrder);

      await this.orderModel
        .findByIdAndUpdate(delivery.orderId, { status: orderStatus })
        .exec();

      return this.sanitizeDelivery(delivery);
    } catch (error) {
      this.handleServiceError(error, 'Delivery status could not be updated');
    }
  }

  async findDeliveries() {
    try {
      const deliveries = await this.deliveryModel
        .find()
        .sort({ createdAt: -1 })
        .exec();

      return deliveries.map((delivery) => this.sanitizeDelivery(delivery));
    } catch (error) {
      this.handleServiceError(error, 'Deliveries could not be listed');
    }
  }

  async findDeliveriesForUser(userId: string) {
    try {
      const deliveries = await this.deliveryModel
        .find({ customerId: userId.trim() })
        .sort({ createdAt: -1 })
        .exec();

      return deliveries.map((delivery) => this.sanitizeDelivery(delivery));
    } catch (error) {
      this.handleServiceError(error, 'Deliveries could not be listed');
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
