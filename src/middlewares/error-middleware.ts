import { AxiosError } from 'axios';
import { Middleware } from 'koa';

const errorMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (error: unknown) {
    console.log("----------Unknown error------------", error)
    if (error instanceof AxiosError) {
      ctx.logger.error(error.response?.data ?? 'Unknown error, sorry...');
      ctx.body = error.response?.data ?? 'Unknown error, sorry...';
      ctx.status = error.response?.status ?? 505;
    } else {
      ctx.logger.error(error);
      ctx.body = error.message;
      ctx.status = error.status ?? 500;
    }
  }
};

export default errorMiddleware;
