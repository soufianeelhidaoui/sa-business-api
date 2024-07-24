import { HttpStatusCode } from 'axios';
import { Middleware } from 'koa';

import { BrandList } from '@ts-types/brand.t';

const validateBrandMiddleware: Middleware = (ctx, next) => {
  if (BrandList.includes(ctx.params.brand)) {
    return next();
  } else {
    ctx.throw(HttpStatusCode.BadRequest, 'Invalid brand');
  }
};

export default validateBrandMiddleware;
