import {
  BadRequestException,
  Controller,
  Get,
  ParseArrayPipe,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductService } from './products.service';
import { GetProductListPreviewQueryPramDTO } from './dto/GetProductListPreviewQueryPramDTO.dto';
import { GetProductOptionBasicInfoList } from './dto/GetProductBasicInfoList.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductService) {}

  @UseInterceptors(CacheInterceptor)
  @Get('/categorylist')
  async getCategoryList() {
    return this.productsService.getCategoryList();
  }
  @Get('/brandlist')
  @UseInterceptors(CacheInterceptor)
  async getBrandList() {
    return this.productsService.getBrandList();
  }
  @Get('/productlist')
  @UseInterceptors(CacheInterceptor)
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
      product_per_page,
      products_id,
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
      product_per_page,
      products_id,
    );
  }
  @Get('/productdetail')
  async getAnProductDetail(
    @Query('product_id', ParseIntPipe) product_id: number,
  ) {
    return this.productsService.getAnProductDetail(product_id);
  }
  @Get('/get_product_option_basic_info_list')
  async getProductOptionBasicInfoList(
    @Query() params: GetProductOptionBasicInfoList,
  ) {
    const { page, product_per_page, products_option_id } = params;
    return this.productsService.getProductOptionBasicInfoList(
      page,
      product_per_page,
      products_option_id,
    );
  }
}
