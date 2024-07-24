import axios, { type AxiosInstance } from "axios";

import config from "@config";
import type {
	KVPSSecret,
	PaymentStatusPayload,
	SmartPayCheckoutType,
} from "@ts-types/smartpay.t";

export class SmartPayClient {
	private readonly client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: config.get("VITE_SMARTPAY_BASE_URL"),
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});
	}

	async createCheckout(
		paymentInfo: KVPSSecret,
		payload: object,
	): Promise<SmartPayCheckoutType> {
		const response = await this.client.post(
			"/payment/creation",
			{
				merchantKey: paymentInfo.merchantKey,
				...payload,
			},
			{
				auth: {
					password: paymentInfo.merchantSecret,
					username: paymentInfo.merchantKey,
				},
			},
		);

		return response.data;
	}

	async getPaymentStatus(
		paymentInfo: KVPSSecret,
		transactionId: string,
	): Promise<PaymentStatusPayload> {
		const response = await this.client.get(`/payment/status/${transactionId}`, {
			auth: {
				password: paymentInfo.merchantSecret,
				username: paymentInfo.merchantKey,
			},
		});

		return response.data;
	}
}
