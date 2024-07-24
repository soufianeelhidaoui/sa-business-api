import { Middleware } from 'koa';

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = (ctx) => {
  ctx.body = ctx.state.dealers;
};

export default resolver;
