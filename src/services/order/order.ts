import { sendCustomer } from "@clients/email/email";
import {
	getOrderDetails,
	updateOrder as syliusUpdateOrder,
} from "@clients/sylius/sylius";
import config from "@config";
import getDealers from "@services/dealers/get-dealers";
import type { Brand } from "@ts-types/brand.t";
import type { Dealer } from "@ts-types/dealers.t";
import type { IOrder, UpdateOrderConfig } from "@ts-types/order.t";
import getPrivacyPolicy from "@utils/get-privacy-policy";
import type { AxiosResponse } from "axios";
import type { Context } from "koa";

export const updateOrder = async (
	ctx: Context,
	c: UpdateOrderConfig,
): Promise<AxiosResponse<{ data: IOrder; status: number }, unknown>> => {
	ctx.logger.info("updating order");

	const result: AxiosResponse<{ data: IOrder; status: number }> =
		await syliusUpdateOrder(c.brand as Brand, c.kvps, c.orderId, {
			state: c.state,
			notes: c.notes,
		});

	if (
		config.get("VITE_SA_API_SEND_MAIL_ON_ORDER_UPDATE_FF") === "true" &&
		c.state !== "completed"
	) {
		const fromAddress = config.get(
			`VITE_${c.brand.toUpperCase()}_FROM_ADDRESS`,
		);
		const fromAddressArn = config.get(
			`VITE_${c.brand.toUpperCase()}_FROM_ADDRESS_ARN`,
		);

		if (fromAddress === "" || fromAddressArn === "") {
			ctx.logger.error(
				`can't send notification e-mail because sender is not configured for ${c.brand}`,
			);
			return result;
		}
		ctx.logger.info(`fetching order details with ${c.state}`);
		const dealers = await getDealers(c.brand as Brand);
		const dealer = dealers.find((dealer) => dealer.kvps === c.kvps);
		const orderDetails = await getOrderDetails(
			c.brand as Brand,
			c.kvps,
			c.orderId,
		);
		ctx.logger.info("sedingemail to customer...");
		await sendCustomer({
			config: {
				fromAddress: fromAddress,
				fromAddressARN: fromAddressArn,
			},
			template: {
				name: c.state,
				data: {
					...result.data,
					brand: c.brand as Brand,
					privacyPolicyURL: getPrivacyPolicy(c.brand),
					partner: dealer as Dealer,
					emailLogo: "",
					emailHero: "",
					websiteURL: "",
					orderDetails: orderDetails.data,
				},
			},
		});
		ctx.logger.info("email sent successfully");
	}

	ctx.logger.info("order updated successfully");

	return result;
};
