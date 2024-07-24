import type { Middleware, Context } from "koa";

import type { IOrder } from "@ts-types/order.t";
import type { AxiosResponse } from "axios";
import { updateOrder } from "@services/order/order";

/*
  Everything from the retrieving the data to
    handling the errors should already have been handled
    by the middlewares
*/

const resolver: Middleware = async (ctx: Context) => {
	const { brand, kvps } = ctx.state;
	const { orderId } = ctx.params;
	const { state, notes } = <{ state: string; notes: string }>ctx.request.body;
	ctx.logger = ctx.logger.child({
		orderId: orderId,
		status: state,
	});

	const result: AxiosResponse<{ data: IOrder; status: number }> =
		await updateOrder(ctx, { brand, kvps, orderId, state, notes });

	ctx.status = result.status;
	ctx.body = result.data;
};

export default resolver;
