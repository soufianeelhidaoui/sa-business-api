import { Middleware } from 'koa';

import { getOrders } from '@clients/sylius/sylius';
import { IOrder } from '@ts-types/order.t';
import { AxiosResponse } from 'axios';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
  ctx.logger.info('Getting orders');
  const result: AxiosResponse<{ data: { items: IOrder[], count: Number }, status: Number}> = await getOrders(ctx.state.brand, ctx.state.kvps, ctx.querystring);

  ctx.status = result.status;
  ctx.body = result.data;

  ctx.logger.info('Orders found');
};

export default resolver;
