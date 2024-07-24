import { HttpStatusCode } from 'axios';
import type { Middleware } from 'koa';

import type { Dealer } from '@ts-types/dealers.t';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = (ctx) => {
  ctx.logger.info(`Fetching dealers for ${ctx.params.kvps}`);
  const dealer: Dealer = ctx.state.dealers.find(({ kvps }: Dealer) => kvps === ctx.params.kvps);

  if (!dealer) {
    ctx.throw(HttpStatusCode.NotFound, 'Dealer not found');
  }

  ctx.body = dealer;
  ctx.logger.info('Dealers retrieved successfully');
};

export default resolver;
