import type { Middleware } from "koa";

import { updatePayment } from "@services/payment/payment";

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx) => {
	const result = await updatePayment(ctx.logger, ctx.request.body);
	ctx.body = result?.data;
};

export default resolver;
