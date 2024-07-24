import { HttpStatusCode } from 'axios';
import { Middleware } from 'koa';

import { createCheckout } from '@services/payment/payment';
import { SmartPayCheckoutType } from '@ts-types/smartpay.t';


/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
  ctx.logger.info(`Initializing payment for KVPS: ${ctx.params.kvps} on ${ctx.params.brand}`);
  const checkoutInfo: SmartPayCheckoutType = await createCheckout(ctx.params.brand, ctx.params.kvps, ctx.request.body);

  if (!checkoutInfo) {
    ctx.throw(HttpStatusCode.Forbidden, 'Could not create a checkout for the given KVPS');
  }

  ctx.logger.info('Checkout initialized successfully');
  ctx.status = 201;
  ctx.body = checkoutInfo;
};

export default resolver;
