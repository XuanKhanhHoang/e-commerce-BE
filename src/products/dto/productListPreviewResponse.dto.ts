type productOfproductListPreviewResponse = {
  original_price: number;
  price_sell: number;
  discount: number;
  name: string;
  product_id: number;
  logo: string;
};
type productListPreviewResponse = productOfproductListPreviewResponse[];
