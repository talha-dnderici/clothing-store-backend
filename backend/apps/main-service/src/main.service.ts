import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class MainService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private handleServiceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(fallbackMessage);
  }

  private sanitizeProduct(product: ProductDocument) {
    const object = product.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  async createProduct(payload: CreateProductDto) {
    try {
      const product = await this.productModel.create(payload);
      return this.sanitizeProduct(product);
    } catch (error) {
      this.handleServiceError(error, 'Product could not be created');
    }
  }

  async findAllProducts() {
    try {
      const products = await this.productModel.find().sort({ createdAt: -1 }).exec();
      return products.map((product) => this.sanitizeProduct(product));
    } catch (error) {
      this.handleServiceError(error, 'Products could not be listed');
    }
  }

  async findOneProduct(id: string) {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.sanitizeProduct(product);
    } catch (error) {
      this.handleServiceError(error, 'Product could not be fetched');
    }
  }

  async updateProduct(id: string, payload: UpdateProductDto) {
    try {
      const product = await this.productModel
        .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        .exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.sanitizeProduct(product);
    } catch (error) {
      this.handleServiceError(error, 'Product could not be updated');
    }
  }

  async deleteProduct(id: string) {
    try {
      const product = await this.productModel.findByIdAndDelete(id).exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.handleServiceError(error, 'Product could not be deleted');
    }
  }
}
