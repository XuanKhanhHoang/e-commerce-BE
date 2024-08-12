// cSpell:ignore VNpay
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createOrderDTO, orderDTO } from './dto/createOrder.dto';
import { Order } from 'src/customer/dto/getUserDetailResponse';
import { VNpayPaymentsService } from 'src/payments/vnpay_payments.service';
import { order_status } from './order_status_id.data';
import { payment_method } from '../payments/payment_method_id.data';
import getDeliveryFee from 'src/utils/getDeliveryFee';
@Injectable()
export class OrderService {
  constructor(
    private prismaService: PrismaService,
    private vnPayPaymentsService: VNpayPaymentsService,
  ) {}

  async createOrder(
    customer_id: number,
    data: createOrderDTO,
    payment_method_id: number = 1,
  ) {
    const { data: orders, address, phone_number, recipient_name } = data;
    const district_id = Number(address.split(',', 3)[1]);
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
    //? BEHIND HERE , options[index].amount IS THE VALUE OF AMOUNT IN ORDER WHICH USE TO CREATE ORDER
    options.forEach((element, index, value) => {
      let tmp = orders.find((item) => item.option_id == element.id);
      if (element.amount - tmp.amount < 0)
        throw new BadRequestException('amount is bigger than product in stock');
      else value[index].amount = tmp.amount;
    });
    try {
      return this.prismaService.$transaction(async (service) => {
        let total_value = 0;
        let an_order_list_item = options.map((item) => {
          let price_sell = (item.price_sell * (100 - item.discount)) / 100;
          total_value += price_sell * item.amount;
          return {
            amount: item.amount,
            discount: item.discount,
            option_id: item.id,
            order_id: -1,
            price: price_sell,
          };
        });
        let deliver_fee = getDeliveryFee(district_id).fee;
        total_value += deliver_fee;
        let { id: order_id } = await service.orders.create({
          data: {
            user_id: customer_id,
            payment_method_id: payment_method_id,
            value: total_value,
            phone_number: phone_number,
            recipient_name: recipient_name,
            status_id:
              payment_method_id != payment_method.vnpay
                ? order_status.wait_confirmation
                : order_status.wait_for_pay,
            delivery_address: address,
            deliver_fee: deliver_fee,
          },
          select: {
            id: true,
          },
        });
        //*  PLEASE CHECK THE NOTE ON THE ABOVE

        an_order_list_item.forEach((item) => {
          item.order_id = order_id;
        });
        let order_list_id = await service.order_list_product.createMany({
          data: an_order_list_item,
          skipDuplicates: true,
        });
        //* Check if an item in order_list isn't created
        if (order_list_id.count != an_order_list_item.length)
          throw new InternalServerErrorException();

        return { order_id: order_id, total_price: total_value };
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
  async updateStatusAnOrderNoCheck(order_id: number, status_id: number) {
    let res = await this.prismaService.orders.update({
      data: {
        status_id: status_id,
      },
      where: {
        id: order_id,
      },
      select: {
        id: true,
      },
    });
    if (!res) throw new BadRequestException('order_id not found');
    return res;
  }
  async getOrderList(
    customerId: number,
    pageOrder = 1,
    orderStatusIdRequire: number | undefined,
  ) {
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
        payment_method: {
          select: {
            id: true,
            name: true,
          },
        },
        receivedAt: true,
        recipient_name: true,
        phone_number: true,
        value: true,
      },
      orderBy: {
        createAt: 'desc',
      },
      take: orderPerPage,
      skip: (pageOrder - 1) * orderPerPage,
    });
    let res: ((typeof orders)[number] & { name: string })[] = [];
    if (orders.length != 0) {
      res = orders.map((order, index) => {
        let name: string[] = [];
        order.order_list.forEach((item, index) => {
          if (name.length == 0)
            return (name[0] = item.option.products.name.trim());
          if (name[name.length - 1] != item.option.products.name.trim()) {
            name.push(item.option.products.name.trim());
          }
        });
        return {
          ...order,
          name: name.join(','),
        };
      });
    }
    return { totalPage: totalPage, value: res };
  }
  async getOrder(order_id: number, user_id: number) {
    let order = await this.prismaService.orders.findFirst({
      where: {
        user_id: user_id,
        id: order_id,
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
                image: true,
              },
            },
          },
          where: {
            option: {
              is_deleted: false,
            },
          },
        },
        payment_method: {
          select: {
            id: true,
            name: true,
          },
        },
        receivedAt: true,
        recipient_name: true,
        phone_number: true,
        value: true,
        delivery_address: true,
        deliver_fee: true,
      },
    });
    if (!order)
      throw new NotFoundException(
        'order_id not found or it not exist in your order list',
      );
    else return order;
  }
  async getValueOfOrder(order_id: number, customer_id: number) {
    let res = await this.prismaService.orders.findFirst({
      where: {
        id: order_id,
        user_id: customer_id,
      },
      select: {
        value: true,
      },
    });
    if (!res) throw new NotFoundException();
    else return res.value;
  }
  async cancelAnOrder(order_id: number, user_id: number) {
    try {
      let order = await this.prismaService.orders.update({
        where: {
          user_id: user_id,
          id: order_id,
          status_id: {
            notIn: [
              order_status.cancelled,
              order_status.delivered,
              order_status.delivering,
            ],
          },
        },
        data: {
          status_id: order_status.cancelled,
        },
      });
      if (!order) {
        throw new BadRequestException(
          'You have no permisson or order not found',
        );
      }
      return {
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }
  async test(ipAddr: any) {
    return {};
    this.vnPayPaymentsService.createPayment(ipAddr, 10002, 1000);
  }
}
