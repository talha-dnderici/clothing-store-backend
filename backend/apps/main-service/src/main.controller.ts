import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
  findAllProducts() {
    return this.mainService.findAllProducts();
  }

  @MessagePattern('main.findAllCategories')
  findAllCategories() {
    return this.mainService.findAllCategories();
  }

  @MessagePattern('main.findOneProduct')
  findOneProduct(@Payload() id: string) {
    return this.mainService.findOneProduct(id);
  }

  @MessagePattern('main.findOneCategory')
  findOneCategory(@Payload() id: string) {
    return this.mainService.findOneCategory(id);
  }

  @MessagePattern('main.updateProduct')
  updateProduct(@Payload() payload: { id: string; dto: UpdateProductDto }) {
    return this.mainService.updateProduct(payload.id, payload.dto);
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
