import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { ReviewCommentDto } from './dto/review-comment.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPricingDto } from './dto/update-product-pricing.dto';
import { MainService } from './main.service';

@Controller()
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @MessagePattern('main.createProduct')
  createProduct(@Payload() payload: CreateProductDto) {
    return this.mainService.createProduct(payload);
  }

  @MessagePattern('main.createCategory')
  createCategory(@Payload() payload: CreateCategoryDto) {
    return this.mainService.createCategory(payload);
  }

  @MessagePattern('main.findAllProducts')
  findAllProducts(@Payload() payload: ListProductsDto) {
    return this.mainService.findAllProducts(payload);
  }

  @MessagePattern('main.findAllCategories')
  findAllCategories() {
    return this.mainService.findAllCategories();
  }

  @MessagePattern('main.findOneProduct')
  findOneProduct(@Payload() id: string) {
    return this.mainService.findOneProduct(id);
  }

  @MessagePattern('main.createComment')
  createComment(@Payload() payload: CreateCommentDto) {
    return this.mainService.createComment(payload);
  }

  @MessagePattern('main.createRating')
  createRating(@Payload() payload: CreateRatingDto) {
    return this.mainService.createRating(payload);
  }

  @MessagePattern('main.findPublicComments')
  findPublicComments(@Payload() productId: string) {
    return this.mainService.findPublicComments(productId);
  }

  @MessagePattern('main.findProductRatings')
  findProductRatings(@Payload() productId: string) {
    return this.mainService.findProductRatings(productId);
  }

  @MessagePattern('main.findCommentsForManager')
  findCommentsForManager(@Payload() payload: { status?: string }) {
    return this.mainService.findCommentsForManager(payload?.status);
  }

  @MessagePattern('main.reviewComment')
  reviewComment(@Payload() payload: { id: string; dto: ReviewCommentDto }) {
    return this.mainService.reviewComment(payload.id, payload.dto);
  }

  @MessagePattern('main.findOneCategory')
  findOneCategory(@Payload() id: string) {
    return this.mainService.findOneCategory(id);
  }

  @MessagePattern('main.updateProduct')
  updateProduct(@Payload() payload: { id: string; dto: UpdateProductDto }) {
    return this.mainService.updateProduct(payload.id, payload.dto);
  }

  @MessagePattern('main.updateProductPricing')
  updateProductPricing(
    @Payload() payload: { id: string; dto: UpdateProductPricingDto },
  ) {
    return this.mainService.updateProductPricing(payload.id, payload.dto);
  }

  @MessagePattern('main.updateCategory')
  updateCategory(@Payload() payload: { id: string; dto: UpdateCategoryDto }) {
    return this.mainService.updateCategory(payload.id, payload.dto);
  }

  @MessagePattern('main.deleteProduct')
  deleteProduct(@Payload() id: string) {
    return this.mainService.deleteProduct(id);
  }

  @MessagePattern('main.deleteCategory')
  deleteCategory(@Payload() id: string) {
    return this.mainService.deleteCategory(id);
  }
}
