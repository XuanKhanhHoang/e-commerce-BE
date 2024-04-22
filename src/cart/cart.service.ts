/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prismaService: PrismaService) {}

  async get(
    customerId: number,
    page = 1,
  ): Promise<{
    totalPage: number;
    value: {
      id: number;
      option: an_product_option;
    }[];
  }> {
    const cartPerPage = 6;
    let totalPage = 0;
    const total = await this.prismaService.cart.count({
      where: {
        user_id: customerId,
      },
    });
    if (total == 0) return { totalPage: 0, value: [] };
    totalPage = Math.ceil(total / cartPerPage);
    if (page > totalPage) throw new BadRequestException('page not found');
    let cart = await this.prismaService.cart.findMany({
      where: {
        user_id: customerId,
      },
      select: {
        id: true,
        option: {
          select: {
            name: true,
            discount: true,
            amount: true,
            price_sell: true,
            products: {
              select: {
                name: true,
              },
            },
            image: true,
            id: true,
          },
        },
      },
    });
    let res: {
      id: number;
      option: an_product_option;
    }[] = cart.map((item) => {
      return {
        ...item,
        option: {
          ...item.option,
          id: item.option.id,
          selling_price:
            ((100 - item.option.discount) / 100) * item.option.price_sell,
          original_price: item.option.price_sell,
        },
      };
    });
    return {
      totalPage: totalPage,
      value: res,
    };
  }
  async update(
    customerId: number,
    cart: {
      option_id: number;
      id: number;
    }[],
  ): Promise<{ message: 'update success' } | any> {
    return {};
    // try {
    //   return this.prismaService.$transaction(async (service) => {
    //     if (cart.length == 0) {
    //       service.cart.deleteMany({
    //         where: {
    //           user_id: customerId,
    //         },
    //       });
    //       return { message: 'update success' };
    //     }
    //     let option_id_Lst = cart.map((item) => item.option_id);
    //     service.cart.deleteMany({
    //       where: {
    //         user_id: customerId,
    //         option_id: {
    //           notIn: option_id_Lst,
    //         },
    //       },
    //     });
    //     let res = Promise.all(
    //       option_id_Lst.map(async (item) => {
    //         await service.cart.upsert({
    //           where: {
    //             option_id: item,
    //             user_id: customerId,
    //             id:item.
    //           },
    //           create: {
    //             option_id: item,
    //             user_id: customerId,
    //           },
    //           update: {},
    //         });
    //       }),
    //     );
    //     return { message: 'update success' };
    //   });
    // } catch (e) {
    //   throw e;
    // }
  }
  async delete(
    customerId: number,
    cart_id: number,
  ): Promise<{
    cart_id: number;
  }> {
    const cart = await this.prismaService.cart.count({
      where: {
        user_id: customerId,
        id: cart_id,
      },
    });
    if (cart == 0) throw new BadRequestException('cart_id not found');
    return this.prismaService.$transaction(async (service) => {
      try {
        let res = await service.cart.delete({
          where: {
            id: cart_id,
          },
        });
        if (res) {
          return { cart_id: res.id };
        }
      } catch (error) {
        throw error;
      }
    });
  }
  async addProrduct(user_id: number, option_id: number) {
    try {
      if (
        (await this.prismaService.cart.count({
          where: {
            user_id: user_id,
            option_id: option_id,
          },
        })) >= 1
      )
        throw new BadRequestException('this option is exist');
      let res = await this.prismaService.cart.create({
        data: {
          option_id: option_id,
          user_id: user_id,
        },
      });
      return { cart_id: res.id };
    } catch (e) {
      throw e;
    }
  }
}
