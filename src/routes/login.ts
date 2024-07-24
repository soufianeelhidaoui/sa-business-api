import { HttpStatusCode } from 'axios';
import { Middleware } from 'koa';

import { login } from '@services/login/login';


/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
  ctx.logger.info('Logging in');
  const token = await login(ctx.request.body);
  if (!token) {
    ctx.throw(HttpStatusCode.Forbidden, 'Failed to login');
  }
  ctx.logger.info('user successfully logged in');
  ctx.status = HttpStatusCode.Ok;
  ctx.body = { token };
};

export default resolver;
