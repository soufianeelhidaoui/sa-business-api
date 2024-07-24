import { HttpStatusCode } from 'axios';
import { Middleware } from 'koa';

import { PaymentInfo } from '@schema/payment';
import { getPaymentStatus } from '@services/payment/payment';


/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
  ctx.logger.info(`Getting payment status for ${ctx.params.transactionId}`);
  const savedPayment = await PaymentInfo.findOne({ transactionId: ctx.params.transactionId });
  if (!savedPayment) {
    ctx.throw(HttpStatusCode.NotFound, 'Payment status not found');
  }

  const paymentStatus = await getPaymentStatus(savedPayment!);
  ctx.body = paymentStatus;
  ctx.logger.info('Payment status fetched successfully');
};

export default resolver;
