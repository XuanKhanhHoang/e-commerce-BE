import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { orderDTO } from './dto/createOrder.dto';
import { order_list_product } from '@prisma/client';
import { Order } from 'src/customer/dto/getUserDetailResponse';

@Injectable()
export class OrderService {
  constructor(private prismaService: PrismaService) {}

  async createOrder(
    customer_id: number,
    orders: orderDTO[],
    payment_method_id: number = 1,
  ) {
    if (
      !(await this.prismaService.payment_method.findFirst({
        where: {
          id: payment_method_id,
        },
      }))
    ) {
      throw new NotFoundException('payment_method_id not found ');
    }
    if (orders.length == 0 || !orders)
      throw new BadRequestException('Order is invalid');

    let options = await this.prismaService.product_option.findMany({
      where: {
        is_deleted: false,
        id: {
          in: orders.map((item) => {
            return item.option_id;
          }),
        },
      },
    });
    if (options == undefined) throw new NotFoundException('option not found');
    options.forEach((element, index, value) => {
      let tmp = orders.find((item) => item.option_id == element.id);
      if (element.amount - tmp.amount < 0)
        throw new BadRequestException('amount is bigger than product in stock');
      else value[index].amount = tmp.amount;
      // BEHIND HERE , options[index].amount IS THE VALUE OF AMOUNT IN ORDER WHICH USE TO CREATE ORDER
    });
    try {
      return this.prismaService.$transaction(async (service) => {
        let order_id = await service.orders.create({
          data: {
            user_id: customer_id,
          },
          select: {
            id: true,
          },
        });
        //  PLEASE CHECK THE NOTE ON THE ABOVE
        let an_order_list_item = options.map((item) => {
          let price_sell =
            (item.price_sell * item.amount * (100 - item.discount)) / 100;
          return {
            amount: item.amount,
            discount: item.discount,
            option_id: item.id,
            order_id: order_id.id,
            price: price_sell,
          };
        });
        let order_list_id = await service.order_list_product.createMany({
          data: an_order_list_item,
          skipDuplicates: true,
        });
        if (order_list_id.count != an_order_list_item.length)
          throw new InternalServerErrorException();
        return { order_id: order_id.id };
      });
    } catch (error) {
      throw error;
    }
  }
  async updateStatusAnOrder(order_id: number, status_id: number) {
    if (
      (await this.prismaService.order_status.count({
        where: {
          id: status_id,
        },
      })) == 0
    )
      throw new BadRequestException('status_id not found');
    let res = await this.prismaService.orders.update({
      data: {
        status_id: status_id,
      },
      where: {
        id: order_id,
      },
    });
    if (!res) throw new BadRequestException('order_id not found');
    return res;
  }
  async getOrderList(
    customerId: number,
    pageOrder = 1,
    orderStatusIdRequire: number | undefined,
  ): Promise<{ totalPage: number; value: Order[] }> {
    const orderPerPage = 4;
    let totalPage = 0;
    let conditions =
      orderStatusIdRequire != undefined
        ? {
            user_id: customerId,
            status_id: orderStatusIdRequire,
          }
        : {
            user_id: customerId,
          };
    const orderNum = await this.prismaService.orders.count({
      where: conditions,
    });
    totalPage = Math.ceil(orderNum / orderPerPage);
    if (orderNum == 0) return { totalPage: 0, value: [] };
    if (pageOrder > totalPage) throw new NotFoundException('page not found');

    const orders = await this.prismaService.orders.findMany({
      where: conditions,
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
