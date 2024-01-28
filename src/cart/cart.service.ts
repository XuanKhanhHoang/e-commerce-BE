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
      option: {
        name: string;
        price_sell: number;
        original_price: number;
        amount: number;
        discount: number;
        image: string;
        id: number;
      };
      id: number;
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
    let cart: any[] = await this.prismaService.cart.findMany({
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
    cart.forEach(
      (item: {
        id: number;
        option: {
          amount: number;
          name: string;
          price_sell: number;
          discount: number;
          image: string;
          products: {
            name: string;
          };
        };
      }) => {
        let tmp = {
          ...item,
          option: {
            ...item.option,
            price_sell:
              ((100 - item.option.discount) / 100) * item.option.price_sell,
            original_price: item.option.price_sell,
          },
        };
        item = tmp;
      },
    );
    return {
      totalPage: totalPage,
      value: cart as {
        option: {
          name: string;
          price_sell: number;
          original_price: number;
          amount: number;
          discount: number;
          image: string;
          products: {
            name: string;
          };
          id: number;
        };
        id: number;
      }[],
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
}
