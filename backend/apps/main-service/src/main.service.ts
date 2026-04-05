import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class MainService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
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
      categoryId: object.categoryIds[0] ?? null,
      ...object,
    };
  }

  private sanitizeCategory(category: CategoryDocument) {
    const object = category.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  private createSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureCategoryExists(id: string) {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category not found: ${id}`);
    }

    return category;
  }

  private async normalizeCategoryIds(payload: {
    categoryId?: string;
    categoryIds?: string[];
  }) {
    const rawCategoryIds = payload.categoryIds?.length
      ? payload.categoryIds
      : payload.categoryId
        ? [payload.categoryId]
        : [];

    const categoryIds = [...new Set(rawCategoryIds.map((id) => id.trim()).filter(Boolean))];

    if (!categoryIds.length) {
      throw new BadRequestException(
        'A product must include categoryIds or categoryId',
      );
    }

    const matchedCategories = await this.categoryModel
      .find({ _id: { $in: categoryIds } })
      .select('_id')
      .lean()
      .exec();

    if (matchedCategories.length !== categoryIds.length) {
      throw new NotFoundException('One or more categories were not found');
    }

    return categoryIds;
  }

  async createCategory(payload: CreateCategoryDto) {
    try {
      if (payload.parentCategoryId) {
        await this.ensureCategoryExists(payload.parentCategoryId);
      }

      const category = await this.categoryModel.create({
        ...payload,
        slug: payload.slug?.trim() || this.createSlug(payload.name),
      });

      return this.sanitizeCategory(category);
    } catch (error) {
      this.handleServiceError(error, 'Category could not be created');
    }
  }

  async createProduct(payload: CreateProductDto) {
    try {
      const categoryIds = await this.normalizeCategoryIds(payload);
      const product = await this.productModel.create({
        ...payload,
        categoryIds,
      });
      return this.sanitizeProduct(product);
    } catch (error) {
      this.handleServiceError(error, 'Product could not be created');
    }
  }

  async findAllCategories() {
    try {
      const categories = await this.categoryModel
        .find()
        .sort({ name: 1 })
        .exec();
      return categories.map((category) => this.sanitizeCategory(category));
    } catch (error) {
      this.handleServiceError(error, 'Categories could not be listed');
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

  async findOneCategory(id: string) {
    try {
      const category = await this.categoryModel.findById(id).exec();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return this.sanitizeCategory(category);
    } catch (error) {
      this.handleServiceError(error, 'Category could not be fetched');
    }
  }

  async updateProduct(id: string, payload: UpdateProductDto) {
    try {
      const updatePayload = { ...payload } as UpdateProductDto & {
        categoryIds?: string[];
      };

      if (payload.categoryId || payload.categoryIds) {
        updatePayload.categoryIds = await this.normalizeCategoryIds(payload);
      }

      const product = await this.productModel
        .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
        .exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.sanitizeProduct(product);
    } catch (error) {
      this.handleServiceError(error, 'Product could not be updated');
    }
  }

  async updateCategory(id: string, payload: UpdateCategoryDto) {
    try {
      if (payload.parentCategoryId) {
        if (payload.parentCategoryId === id) {
          throw new BadRequestException(
            'A category cannot be its own parent category',
          );
        }

        await this.ensureCategoryExists(payload.parentCategoryId);
      }

      const category = await this.categoryModel
        .findByIdAndUpdate(
          id,
          {
            ...payload,
            ...(payload.name
              ? { slug: payload.slug?.trim() || this.createSlug(payload.name) }
              : {}),
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return this.sanitizeCategory(category);
    } catch (error) {
      this.handleServiceError(error, 'Category could not be updated');
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

  async deleteCategory(id: string) {
    try {
      const linkedProduct = await this.productModel.findOne({ categoryIds: id }).exec();

      if (linkedProduct) {
        throw new ConflictException(
          'Category cannot be deleted while products are still linked to it',
        );
      }

      const category = await this.categoryModel.findByIdAndDelete(id).exec();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.handleServiceError(error, 'Category could not be deleted');
    }
  }
}
