import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MainService } from './main.service';
import { UpdateStockDto } from './dto/update-stock.dto';

/**
 * SCRUM-12 — Product Manager dedicated microservice surface.
 *
 * The Product Manager can:
 *   - adjust stock levels for products
 *   - list products that currently need to be delivered
 *   - view the invoice + delivery address of each pending order
 *   - change delivery status (processing / in-transit / delivered)
 *   - approve / reject customer comments
 *
 * Routing / RBAC is handled in the API gateway (requireManager guard).
 */
@Controller()
export class ProductManagerController {
  constructor(private readonly mainService: MainService) {}

  @MessagePattern('main.updateStock')
  updateStock(@Payload() payload: { id: string; dto: UpdateStockDto }) {
    return this.mainService.updateStock(payload.id, payload.dto);
  }

  @MessagePattern('main.findLowStock')
  findLowStock(@Payload() payload: { threshold?: number } = {}) {
    return this.mainService.findLowStockProducts(payload?.threshold ?? 5);
  }
}
