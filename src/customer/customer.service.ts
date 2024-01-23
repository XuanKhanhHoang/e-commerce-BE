import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Order,
  UserFullDetailAndDeliveringOrder,
} from './dto/getUserDetailResponse';

@Injectable()
export class CustomerService {
  constructor(private prismaService: PrismaService) {}

  async getCustomerDetail(
    customerId: number,
  ): Promise<UserFullDetailAndDeliveringOrder> {
    let customer = await this.prismaService.user.findUnique({
      where: {
        user_id: customerId,
        is_deleted: false,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        address: true,
        email: true,
        gender: true,
        avartar: true,
        login_name: true,
        phone_number: true,
        orders: {
          select: {
            createAt: true,
            status: true,
            id: true,
            order_list: {
              select: {
                amount: true,
                id: true,
                discount: true,
                price: true,
                option: {
                  select: {
                    name: true,
                    products: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
              where: {
                option: {
                  is_deleted: false,
                },
              },
            },
          },
          orderBy: {
            createAt: 'desc',
          },
          where: {
            status_id: 2,
          },
        },
      },
    });
    let res: any = customer;
    let price: number[] =
      customer.orders.length != 0
        ? customer.orders.map((order, index) => {
            if (!order || !order.order_list || order.order_list.length == 0)
              return -1;
            return order.order_list.reduce((acc, cur) => {
              return (
                acc + ((cur.price * (100 - cur.discount)) / 100) * cur.amount
              );
            }, 0);
          })
        : [];

    if (customer.orders.length != 0) {
      customer.orders.map((order, index) => {
        let name: string[] = [];

        order.order_list.forEach((item, index) => {
          if (name.length == 0)
            return (name[0] = item.option.products.name.trim());
          if (name[name.length - 1] != item.option.products.name.trim()) {
            name.push(item.option.products.name.trim());
          }
        });
        res.orders[index] = {
          ...order,
          price: price[index],
          name: name.join(','),
        };
      });
    }
    return res as UserFullDetailAndDeliveringOrder;
  }
  async getOrderList(
    customerId: number,
    pageOrder = 1,
  ): Promise<{ totalPage: number; value: Order[] }> {
    const orderPerPage = 4;
    let totalPage = 0;
    const orderNum = await this.prismaService.orders.count({
      where: {
        user_id: customerId,
      },
    });
    totalPage = Math.ceil(orderNum / orderPerPage);
    if (pageOrder > totalPage) throw new BadRequestException('page not found');
    const orders = await this.prismaService.orders.findMany({
      where: {
        user_id: customerId,
      },
      select: {
        createAt: true,
        status: true,
        id: true,
        order_list: {
          select: {
            amount: true,
            id: true,
            discount: true,
            price: true,
            option: {
              select: {
                name: true,
                products: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          where: {
            option: {
              is_deleted: false,
            },
          },
        },
      },
      orderBy: {
        createAt: 'desc',
      },
      take: orderPerPage,
      skip: (pageOrder - 1) * orderPerPage,
    });
    let price: number[] =
      orders.length != 0
        ? orders.map((order, index) => {
            if (!order || !order.order_list || order.order_list.length == 0)
              return -1;
            return order.order_list.reduce((acc, cur) => {
              return (
                acc + ((cur.price * (100 - cur.discount)) / 100) * cur.amount
              );
            }, 0);
          })
        : [];
    let res: any = orders;
    if (orders.length != 0) {
      orders.map((order, index) => {
        let name: string[] = [];
        order.order_list.forEach((item, index) => {
          if (name.length == 0)
            return (name[0] = item.option.products.name.trim());
          if (name[name.length - 1] != item.option.products.name.trim()) {
            name.push(item.option.products.name.trim());
          }
        });
        res[index] = {
          ...order,
          price: price[index],
          name: name.join(','),
        };
      });
    }
    return { totalPage: totalPage, value: res as Order[] };
  }
}
