import { Middleware } from 'koa';

import { getOrdersStats } from '@clients/sylius/sylius';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
  ctx.logger.info('Getting orders stats');
  const result = await getOrdersStats(ctx.state.brand, ctx.state.kvps);

  ctx.status = result.status;
  ctx.body = result.data;

  ctx.logger.info('Orders stats found');
};

export default resolver;
