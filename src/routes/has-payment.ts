import { hasPayment } from "@clients/secrets/secrets";
import type { Middleware } from "koa";

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
	const result = await hasPayment(ctx.params.kvps);
	ctx.body = result;
};

export default resolver;
