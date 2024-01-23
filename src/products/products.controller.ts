import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ProductService } from './products.service';
import { GetProductListPreviewQueryPramDTO } from './dto/GetProductListPreviewQueryPramDTO.dto';

@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductService) {}

  @Get('/categorylist')
  async getCategoryList() {
    return this.productsService.getCategoryList();
  }
  @Get('/brandlist')
  async getBrandList() {
    return this.productsService.getBrandList();
  }
  @Get('/productlist')
  async getProductPreviewList(
    @Query() query: GetProductListPreviewQueryPramDTO,
  ) {
    const {
      page,
      brand_id,
      category_id,
      keyword,
      max_price,
      min_price,
      rating,
      order_col,
      order_type,
    } = query;
    return this.productsService.getProductPreviewList(
      page,
      category_id,
      brand_id,
      keyword,
      max_price,
      min_price,
      rating,
      order_type,
      order_col,
    );
  }
  @Get('/productdetail')
  async getAnProductDetail(
    @Query('product_id', ParseIntPipe) product_id: number,
  ) {
    return this.productsService.getAnProductDetail(product_id);
  }
}
