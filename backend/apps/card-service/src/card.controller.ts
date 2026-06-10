import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartUserDto } from './dto/cart-user.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { ListRefundRequestsDto } from './dto/list-refund-requests.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateRefundRequestStatusDto } from './dto/update-refund-request-status.dto';
import { CardService } from './card.service';

@Controller()
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @MessagePattern('card.createCard')
  createCard(@Payload() payload: CreateCardDto) {
    return this.cardService.createCard(payload);
  }

  @MessagePattern('card.getActiveCart')
  getActiveCart(@Payload() payload: CartUserDto) {
    return this.cardService.getActiveCart(payload.userId);
  }

  @MessagePattern('card.addItemToCart')
  addItemToCart(@Payload() payload: AddCartItemDto) {
    return this.cardService.addItemToCart(payload);
  }

  @MessagePattern('card.updateCartItem')
  updateCartItem(@Payload() payload: UpdateCartItemDto) {
    return this.cardService.updateCartItem(payload);
  }

  @MessagePattern('card.removeCartItem')
  removeCartItem(@Payload() payload: RemoveCartItemDto) {
    return this.cardService.removeCartItem(payload);
  }

  @MessagePattern('card.clearCart')
  clearCart(@Payload() payload: CartUserDto) {
    return this.cardService.clearCart(payload.userId);
  }

  @MessagePattern('card.checkout')
  checkout(@Payload() payload: CheckoutDto) {
    return this.cardService.checkout(payload);
  }

  @MessagePattern('card.findOrdersForUser')
  findOrdersForUser(@Payload() payload: CartUserDto) {
    return this.cardService.findOrdersForUser(payload.userId);
  }

  @MessagePattern('card.createRefundRequest')
  createRefundRequest(@Payload() payload: CreateRefundRequestDto) {
    return this.cardService.createRefundRequest(payload);
  }

  @MessagePattern('card.findRefundRequestsForCustomer')
  findRefundRequestsForCustomer(@Payload() payload: CartUserDto) {
    return this.cardService.findRefundRequestsForCustomer(payload.userId);
  }

  @MessagePattern('card.findRefundRequests')
  findRefundRequests(@Payload() payload: ListRefundRequestsDto) {
    return this.cardService.findRefundRequests(payload);
  }

  @MessagePattern('card.updateRefundRequestStatus')
  updateRefundRequestStatus(@Payload() payload: UpdateRefundRequestStatusDto) {
    return this.cardService.updateRefundRequestStatus(payload);
  }

  @MessagePattern('card.findAllOrders')
  findAllOrders() {
    return this.cardService.findAllOrders();
  }

  @MessagePattern('card.findInvoices')
  findInvoices(@Payload() payload: InvoiceQueryDto) {
    return this.cardService.findInvoices(payload);
  }

  @MessagePattern('card.getRevenueReport')
  getRevenueReport(@Payload() payload: RevenueQueryDto) {
    return this.cardService.getRevenueReport(payload);
  }

  @MessagePattern('card.getProfitLossReport')
  getProfitLossReport(@Payload() payload: RevenueQueryDto) {
    return this.cardService.getProfitLossReport(payload);
  }

  @MessagePattern('card.findOrderDeliveryStatusForUser')
  findOrderDeliveryStatusForUser(@Payload() payload: CartUserDto) {
    return this.cardService.findOrderDeliveryStatusForUser(payload.userId);
  }

  @MessagePattern('card.findOneOrder')
  findOneOrder(@Payload() id: string) {
    return this.cardService.findOneOrder(id);
  }

  @MessagePattern('card.findOrderInvoice')
  findOrderInvoice(@Payload() id: string) {
    return this.cardService.findOrderInvoice(id);
  }

  @MessagePattern('card.findOrderInvoicePdf')
  findOrderInvoicePdf(@Payload() id: string) {
    return this.cardService.findOrderInvoicePdf(id);
  }

  @MessagePattern('card.emailOrderInvoice')
  emailOrderInvoice(@Payload() payload: string | { orderId: string; recipientEmail?: string }) {
    return this.cardService.emailOrderInvoice(payload);
  }

  @MessagePattern('card.mockPayment')
  mockPayment(@Payload() payload: { userId: string; amount?: number; orderId?: string }) {
    return this.cardService.mockPayment(payload);
  }

  @MessagePattern('card.updateOrderStatus')
  updateOrderStatus(@Payload() payload: UpdateOrderStatusDto) {
    return this.cardService.updateOrderStatus(payload);
  }

  @MessagePattern('card.updateDeliveryStatus')
  updateDeliveryStatus(@Payload() payload: UpdateDeliveryStatusDto) {
    return this.cardService.updateDeliveryStatus(payload);
  }

  @MessagePattern('card.findDeliveries')
  findDeliveries() {
    return this.cardService.findDeliveries();
  }

  @MessagePattern('card.findDeliveriesForUser')
  findDeliveriesForUser(@Payload() payload: CartUserDto) {
    return this.cardService.findDeliveriesForUser(payload.userId);
  }

  @MessagePattern('card.findAllCards')
  findAllCards() {
    return this.cardService.findAllCards();
  }

  @MessagePattern('card.findOneCard')
  findOneCard(@Payload() id: string) {
    return this.cardService.findOneCard(id);
  }

  @MessagePattern('card.updateCard')
  updateCard(@Payload() payload: { id: string; dto: UpdateCardDto }) {
    return this.cardService.updateCard(payload.id, payload.dto);
  }

  @MessagePattern('card.deleteCard')
  deleteCard(@Payload() id: string) {
    return this.cardService.deleteCard(id);
  }
}
