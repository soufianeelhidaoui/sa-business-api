import { HttpStatusCode } from 'axios';
import { Middleware } from 'koa';

import { updateTerms } from '@services/payment/payment';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
  ctx.logger.info('Updating terms');
  if (!ctx.request.file) {
    ctx.throw(HttpStatusCode.BadRequest, 'Could not read multipart file');
  }
  const result = await updateTerms(ctx.state.brand, ctx.state.kvps, ctx.request.file);
  ctx.status = result.status;
  ctx.body = result.data;
  ctx.logger.info('Terms updated successfully');
};

export default resolver;
