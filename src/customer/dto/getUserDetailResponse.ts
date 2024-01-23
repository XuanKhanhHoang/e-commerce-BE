export interface UserFullDetailAndDeliveringOrder {
  user_id: number;
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  gender: boolean;
  avartar: string;
  login_name: string;
  phone_number: string;
  orders: Order[];
}

export interface Order {
  createAt: string;
  status: {
    id: number;
    status_name: string;
  };
  id: number;
  order_list: OrderList[];
  price: number;
  name: string;
}

export interface OrderList {
  amount: number;
  id: number;
  discount: number;
  price: number;
  option: {
    name: string;
    products: {
      name: string;
    };
  };
}
