import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { MainService } from './main.service';

@Controller()
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @MessagePattern('main.createProduct')
  createProduct(@Payload() payload: CreateProductDto) {
    return this.mainService.createProduct(payload);
  }

  @MessagePattern('main.findAllProducts')
  findAllProducts() {
    return this.mainService.findAllProducts();
  }

  @MessagePattern('main.findOneProduct')
  findOneProduct(@Payload() id: string) {
    return this.mainService.findOneProduct(id);
  }

  @MessagePattern('main.updateProduct')
  updateProduct(@Payload() payload: { id: string; dto: UpdateProductDto }) {
    return this.mainService.updateProduct(payload.id, payload.dto);
  }

  @MessagePattern('main.deleteProduct')
  deleteProduct(@Payload() id: string) {
    return this.mainService.deleteProduct(id);
  }
}
