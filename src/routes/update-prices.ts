import { Middleware, Context } from 'koa';
import { HttpStatusCode } from 'axios';

import updatePrices from '@services/prices/update-prices';
import { updateSyliusPrices } from '@clients/sylius/sylius';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx: Context) => {
  ctx.logger.info('updating prices from files to Sylius by kvps');

  if (!ctx.request.file) {
    ctx.throw(HttpStatusCode.BadRequest, 'Could not read multipart file');
  }

  const {
    notFound,
    deleted,
    prices: newSyliusPrices,
    updated,
  } = await updatePrices(ctx);

  if (updated.length) {
    await updateSyliusPrices(ctx.state.brand, ctx.state.kvps, newSyliusPrices);
  }

  if (notFound.length) {
    ctx.throw(HttpStatusCode.NotFound, 'file not found to be updated');
  }

  const updatedTotal = updated.length;
  const deletedTotal = deleted.length;
  const notFoundTotal = notFound.length;

  ctx.body = {
    updatedTotal,
    notFoundTotal,
    notFound,
    deletedTotal,
  };

  ctx.status = 200;

  ctx.logger.info('Prices updating successfully');
};

export default resolver;
