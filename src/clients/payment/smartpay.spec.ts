import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import axios from "axios";

import MockAdapter from "axios-mock-adapter";
import { SmartPayClient } from "./smartpay";

const mock = new MockAdapter(axios);

const testPaymentInfo = {
	kvps: "FRAC980923",
	merchantKey: "aMerchantKey",
	merchantSecret: "aMerchanSecret",
	companyRegistrationNumber: "39207723",
};
const smartPayBaseUrl = "http://running.vitest.local";

describe("SmartPay client", () => {
	afterEach(() => {
		mock.resetHandlers();
	});

	beforeEach(() => {
		vi.stubEnv("VITE_SMARTPAY_BASE_URL", smartPayBaseUrl);
	});

	test("should be able to initialize a payment", async () => {
		mock.onPost("/payment/creation").reply(200, {});

		const smpClient = new SmartPayClient();
		const result = await smpClient.createCheckout(testPaymentInfo, {});

		expect(result).toBeDefined();
		expect(mock.history.post.length).toBe(1);
		expect(mock.history.post[0].baseURL).toBe(smartPayBaseUrl);
		expect(mock.history.post[0].data).toBe(
			JSON.stringify({ merchantKey: "aMerchantKey" }),
		);
	});

	test("should be able to get payment status", async () => {
		mock.onGet("/payment/status/aRandomUUID").reply(200, {});

		const smpClient = new SmartPayClient();

		const result = await smpClient.getPaymentStatus(
			testPaymentInfo,
			"aRandomUUID",
		);
		expect(result).toBeDefined();
		expect(mock.history.get.length).toBe(1);
		expect(mock.history.get[0].baseURL).toBe(smartPayBaseUrl);
		expect(mock.history.get[0].url).toContain("aRandomUUID");
	});
});
