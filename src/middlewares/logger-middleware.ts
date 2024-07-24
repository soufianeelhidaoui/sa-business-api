import crypto from 'crypto';
import { Middleware } from 'koa';

import logger from '@utils/logger';

const loggerMiddleware: Middleware = (ctx, next) => {
  const requestUUID = crypto.randomUUID();
  const log = logger.child({ reqID: requestUUID });
  ctx.logger = log;

  return next();
};

export default loggerMiddleware;
