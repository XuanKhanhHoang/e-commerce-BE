import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { raw } from '@prisma/client/runtime/library';
@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}

  getCategoryList(): Promise<
    {
      id: number;
      name: string;
      icon: string;
      is_deleted: boolean;
    }[]
  > {
    return this.prismaService.category.findMany({
      where: { is_deleted: false },
    });
  }
  async getBrandList() {
    return this.prismaService.brand.findMany({
      where: {},
    });
  }
  async getProductPreviewList(
    page: number = 1,
    category_id: number | undefined,
    brand_id: number | undefined,
    keyword: string | undefined,
    max_price: number | undefined,
    min_price: number | undefined,
    rating: string[] | string | undefined,
    order_type: 'ASC' | 'DESC' = 'ASC',
    order_col: string = 'update_at',
  ): Promise<{
    data: productListPreviewResponse;
    totalPage: number;
    categoryName: string;
  }> {
    try {
      let categoryName = '';
      if (category_id) {
        let category = await this.prismaService.category.findUnique({
          where: {
            id: Number(category_id),
            is_deleted: false,
          },
          select: {
            name: true,
          },
        });
        if (!category) throw new BadRequestException('category_id not found');
        categoryName = category.name;
      }
      if (max_price < 0 || min_price < 0 || min_price > max_price)
        throw new BadRequestException('Price condition invalid');
      //check rating condition
      let ratingArr: string[] | undefined;
      if (rating != undefined) {
        if (
          rating.length == 1 &&
          (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)
        )
          throw new BadRequestException('invalid rating');
        if (rating.length != 1 && !Array.isArray(rating))
          throw new BadRequestException('invalid rating');
        for (let i = 0; i < (rating as string[]).length; i++) {
          let n = Number(rating[i]);
          if (isNaN(n) || n < 1 || n > 5) {
            throw new BadRequestException('invalid rating');
          }
        }
      }
      //convert an char(string.length==1) to an array
      ratingArr =
        rating != undefined
          ? rating.length == 1
            ? [rating as string]
            : (rating as string[])
          : undefined;

      //check order condition
      const columnExists: any[] = await this.prismaService.$queryRaw(
        raw(`SHOW COLUMNS FROM products LIKE '${order_col}';`),
      );
      if (
        order_col != undefined &&
        columnExists.length == 0 &&
        order_col != 'price_sell'
      )
        throw new BadRequestException(`order_col isn't exist`);

      if (order_type == `ASC`) {
      } //pass
      else if (order_type == `DESC`) {
      } //pass
      else throw new BadRequestException(`order_type isn't exist`);
      //condition string PrismaSql
      let brandIdCondition = Prisma.raw(
        brand_id != undefined ? `AND brand_id=${brand_id}` : '',
      );
      let keywordCondition =
        keyword != undefined
          ? Prisma.sql` AND UPPER(p.name) LIKE UPPER ('${Prisma.raw(
              `%${keyword}%`,
            )}') `
          : Prisma.sql``;
      let priceCondition = raw(
        (max_price != undefined ? ` AND po.price_sell <=${max_price} ` : '') +
          (min_price != undefined ? ` AND po.price_sell >=${min_price} ` : ''),
      );
      let ratingCondition = raw(
        ratingArr != undefined
          ? ` AND CAST(ROUND(p.rating) AS UNSIGNED INTEGER)  IN (${ratingArr.join()})`
          : '',
      );
      let orderCondition = raw(` ORDER BY ${order_col} ${order_type} `);
      //Main PrismaSql get Number of data found
      const sql = Prisma.sql`SELECT count(*) as count from products p JOIN (SELECT  ANY_VALUE(po.price_sell) as price_sell,ANY_VALUE(po.discount) as discount ,po.product_id  ,MIN(price_sell * (100-discount)/100) AS original_price from product_options po    GROUP  BY  product_id
      ) po 
      on p.product_id  = po.product_id WHERE  p.product_id  IN (
        SELECT product_id
        FROM product_ref_category
        WHERE category_id = ${category_id || true}
      ) 
      ${brandIdCondition}
       ${keywordCondition}
       ${priceCondition}
       ${ratingCondition}
       `;
      const productPerPage = 4;
      //Total Number of data
      let totalData = Number(
        (await this.prismaService.$queryRaw<any>(sql, [keyword]))[0].count,
      );
      let totalPage: number = Math.ceil(totalData / productPerPage);
      //handle exception page dand data not found
      if (totalData == 0)
        return { data: [], totalPage: 0, categoryName: categoryName };
      if (page <= 0 || page > totalPage)
        throw new BadRequestException('page not valid');
      //Main PrismaSql get Data
      let data = await this.prismaService.$queryRaw<
        {
          name: string;
          logo: string;
          product_id: number;
          price_sell: number;
          discount: number;
          original_price: number;
        }[]
      >`SELECT 
      p.name,p.rating, logo, p.product_id, po.price_sell, po.discount,po.original_price
            FROM products p
            JOIN (SELECT  ANY_VALUE(po.price_sell) as original_price,ANY_VALUE(po.discount) as discount ,po.product_id  ,MIN(price_sell * (100-discount)/100) AS price_sell from product_options po    GROUP  BY  product_id
      ) po on p.product_id  = po.product_id
            WHERE is_deleted = false
            AND p.product_id IN (
              SELECT product_id
              FROM product_ref_category
              WHERE category_id = ${category_id || true}
            )
             ${brandIdCondition} 
             ${keywordCondition}
              ${priceCondition}
              ${ratingCondition}
              ${orderCondition}
            LIMIT ${(page - 1) * productPerPage}, ${productPerPage}
           `;

      //Numbering a bigInt because prisma=>bigInt
      data.forEach((item) => {
        (item.price_sell = Number(item.price_sell)),
          (item.discount = Number(item.discount)),
          (item.original_price = Number(item.original_price));
      });
      if (data.length == 0)
        return { data: [], totalPage: 0, categoryName: categoryName };
      return { data: data, totalPage, categoryName: categoryName };
    } catch (e) {
      if (e.status == 500) console.log('error productlist: ', e);
      throw e;
    }
  }
  async getAnProductDetail(product_id: number) {
    if (!product_id || product_id < 0)
      throw new BadRequestException('product_id not valid');
    let product = await this.prismaService.product.findUnique({
      where: {
        product_id: product_id,
        is_deleted: false,
      },
      select: {
        logo: true,
        name: true,
        description: true,
        product_id: true,
        infomation: true,
        rating: true,
        product_options: {
          select: {
            name: true,
            id: true,
            amount: true,
            discount: true,
            image: true,
            price_sell: true,
          },
          where: {
            is_deleted: false,
          },
        },
        brand: true,
        comment: {
          select: {
            id: true,
            content: true,
            rating: true,
            user: {
              select: {
                user_id: true,
                avartar: true,
                first_name: true,
              },
            },
            createAt: true,
            seller_reply: true,
            image: {
              select: {
                image: true,
              },
            },
          },
        },
      },
    });
    if (!product) throw new BadRequestException('Product not found');
    let options = product.product_options.map((item) => {
      let price = item.price_sell;
      delete item.price_sell;
      return {
        originalPrice: price,
        price: (price * (100 - item.discount)) / 100,
        ...item,
      };
    });
    return { ...product, product_options: options };
  }
}
