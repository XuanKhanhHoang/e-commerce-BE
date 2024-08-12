import { Injectable, Logger, Redirect } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { OrderService } from 'src/order/order.service';
import { order_status } from 'src/order/order_status_id.data';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class VNpayPaymentsService {
  private logger = new Logger();
  private vnp_version = '2.1.0';
  private locale = 'vn';
  private currCode = 'VND';

  constructor(private prismaService: PrismaService) {}
  //* amount mean price here
  public async createPayment(ipAddr: any, order_id: number, amount: number) {
    const vnp_command = 'pay';
    //* Get date is formatted (YYYYMMDDHHmmss)
    const now = new Date();
    now.setMinutes(now.getMinutes()); // Thêm 15 phút vào thời gian hiện tại
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Tháng bắt đầu từ 0
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    let createDate = year + month + day + hours + minutes + seconds;

    let tmnCode = process.env.VNP_TmnCode;
    let secretKey = process.env.VNP_HashSecret;
    let vnpUrl = process.env.VNP_Url;
    //TODO return now is incorrect
    let returnUrl = process.env.VNP_ReturnUrl;
    let orderId = order_id;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = this.locale;
    vnp_Params['vnp_CurrCode'] = this.currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params = this.sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
    return { pay_url: vnpUrl };
  }

  public async handleVnPayReturn(
    vnp_Params: querystring.ParsedQs,
  ): Promise<{ orderId: number; status: string }> {
    let orderId = -1;
    let status = vnp_Params['vnp_ResponseCode'] as string;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);

    let secretKey = process.env.VNP_HashSecret;
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
    if (secureHash === signed) {
      orderId = Number(vnp_Params.vnp_TxnRef);
      if (isNaN(orderId)) return { orderId: -1, status: '98' };
      if (status != '00') return { orderId: -1, status: '11' };
      if (
        (await this.prismaService.orders.findFirst({
          where: {
            id: orderId,
            status_id: order_status.wait_confirmation,
          },
          select: { id: true },
        })) != undefined
      )
        return { orderId: orderId, status: status };
      await this.prismaService.orders.update({
        data: {
          status_id: order_status.wait_confirmation,
        },
        where: {
          id: orderId,
        },
      });
      return { orderId: orderId, status: status };
    }
    return { orderId: -1, status: '99' };
  }
  private sortObject(obj: any) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }
}
