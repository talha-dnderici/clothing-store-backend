import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardService } from './card.service';

@Controller()
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @MessagePattern('card.createCard')
  createCard(@Payload() payload: CreateCardDto) {
    return this.cardService.createCard(payload);
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
