import { Middleware, Context } from 'koa';
import { Readable } from 'stream';

import getPrices from '@services/prices/get-prices';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx: Context) => {
  ctx.logger.info('Downloading prices file by kvps');
  const { kvps } = ctx.state;
  const buffer: Buffer = await getPrices(ctx);

  ctx.attachment(`prices.${kvps}.xlsx`);
  ctx.response.set('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  ctx.body = Readable.from(buffer);
  ctx.status = 200;

  ctx.logger.info('Prices file downloaded successfully');
};

export default resolver;
