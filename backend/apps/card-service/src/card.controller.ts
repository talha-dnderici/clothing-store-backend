import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartUserDto } from './dto/cart-user.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCardDto } from './dto/update-card.dto';
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
