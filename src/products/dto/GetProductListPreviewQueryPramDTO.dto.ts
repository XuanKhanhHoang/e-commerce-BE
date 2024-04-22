import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetProductListPreviewQueryPramDTO {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  page: number | undefined;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  category_id: number | undefined;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  brand_id: number | undefined;

  @IsOptional()
  @IsString()
  keyword: string | undefined;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  min_price: number | undefined;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  max_price: number | undefined;

  @IsOptional()
  rating: string[] | string | undefined;

  @IsOptional()
  order_type: 'ASC' | 'DESC' | undefined;

  @IsOptional()
  order_col: string | undefined;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  product_per_page: number | undefined;

  @Transform(({ value }) => {
    return Array.isArray(value)
      ? value.map((item) => parseInt(item, 10)).filter((item) => !isNaN(item))
      : [];
  })
  products_id: number[] | undefined;
}
