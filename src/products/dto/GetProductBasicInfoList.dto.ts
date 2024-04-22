import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class GetProductOptionBasicInfoList {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  page: number | undefined;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number.parseInt(value))
  product_per_page: number | undefined;

  @Transform(({ value }) => {
    return Array.isArray(value)
      ? value.map((item) => parseInt(item, 10)).filter((item) => !isNaN(item))
      : !isNaN(Number(value))
        ? [].concat(Number(value))
        : [];
  })
  products_option_id: number[] | undefined;
}
