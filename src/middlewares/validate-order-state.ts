import { HttpStatusCode } from 'axios';
import { Middleware, Context } from 'koa';

import { orderStateList, orderState } from '@ts-types/order.t';

const validateOrderStateMiddleware: Middleware = (ctx: Context, next) => {
  const { state } = <{state: orderState}>ctx.request.body;
  if (orderStateList.includes(state)) {
    return next();
  } else {
    ctx.throw(HttpStatusCode.BadRequest, 'Invalid order state');
  }
};

export default validateOrderStateMiddleware;
