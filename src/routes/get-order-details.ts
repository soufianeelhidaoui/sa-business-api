import { Middleware, Context } from 'koa';

import { getOrderDetails } from '@clients/sylius/sylius';
import { AxiosResponse } from 'axios';
import { IOrder } from '@ts-types/order.t';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx: Context) => {
  ctx.logger.info('fetch order details');
  const { brand, kvps } = ctx.state;
  const { orderId } = ctx.params;

  const result: AxiosResponse<{ data: IOrder, status: Number }> = await getOrderDetails(brand, kvps, orderId);
  ctx.status = result.status;
  ctx.body = result.data;

  ctx.logger.info('Order details fetched');
};

export default resolver;
