import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { Card, CardDocument } from './schemas/card.schema';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
  ) {}

  private handleServiceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(fallbackMessage);
  }

  private sanitizeCard(card: CardDocument) {
    const object = card.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  // The card service stores only references and shopping preferences.
  // Product details stay in the main service to prevent unnecessary duplication.
  async createCard(payload: CreateCardDto) {
    try {
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
