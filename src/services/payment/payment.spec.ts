import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { type IKVPSSecret, KVPSSecretModel } from "@schema/kvps-secrets";
import { type IPaymentInfo, PaymentInfo } from "@schema/payment";
import type { PaymentStatusPayload } from "@ts-types/smartpay.t";
import logger from "@utils/logger";
import { mockClient } from "aws-sdk-client-mock";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAndLockPayment, shouldCaptureOrRefund } from "./payment";

const mock = new MockAdapter(axios);

describe("The payment service", () => {
	const smClientMock = mockClient(SecretsManagerClient);
	afterEach(() => {
		mock.resetHandlers();
		vi.unstubAllEnvs();
		vi.resetAllMocks();
		smClientMock.reset();
	});

	beforeEach(() => {
		vi.stubEnv("AWS_ACCESS_KEY_ID", "My-AWESOME-Key");
		vi.stubEnv("AWS_SECRET_ACCESS_KEY", "My-AWESOME-Secret");

		vi.spyOn(KVPSSecretModel, "findOne").mockImplementation((): IKVPSSecret => {
			return {
				kvps: "test",
				registrationNumber: "unit-testing",
			};
		});

		smClientMock.on(GetSecretValueCommand).resolves({
			Name: "KVPS-1",
			SecretString: '{"kvps":"KVPS-1","merchantKey":"merchantKey"}',
		});
	});

	it("should be able to wait for locking payment", async () => {
		let calledTimes = 0;
		const mock = vi
			.spyOn(PaymentInfo, "findOneAndUpdate")
			.mockImplementation((): IPaymentInfo | null => {
				if (calledTimes <= 2) {
					calledTimes++;
					return null;
				}

				return {
					transactionId: "my-id",
					locked: true,
				};
			});

		const payment = await getAndLockPayment(logger, "my-id");

		expect(payment).toBeDefined();
		expect(mock).toHaveBeenCalledTimes(calledTimes + 1);
	});

	it("shouldCapture should return false when payment has already been captured", async () => {
		vi.spyOn(PaymentInfo, "findOneAndUpdate").mockImplementation(
			(req): IPaymentInfo => {
				return {
					captured: true,
					transactionId: "my-id",
					locked: false,
				};
			},
		);

		const payment = await shouldCaptureOrRefund(
			logger,
			{
				captured: true,
				transactionId: "my-id",
			} as IPaymentInfo,
			{ paymentStatus: "CAPTURED" } as PaymentStatusPayload,
		);

		expect(payment).toBeFalsy();
	});

	it("should not capture payment if it has not been captured in smartpay", async () => {
		vi.spyOn(PaymentInfo, "findOneAndReplace").mockImplementation(
			(req): IPaymentInfo => {
				return {
					captured: false,
					transactionId: "my-id",
					locked: false,
				};
			},
		);

		const payment = await shouldCaptureOrRefund(
			logger,
			{
				captured: false,
				transactionId: "my-id",
			} as IPaymentInfo,
			{ paymentStatus: "CAPTURE_PENDING" } as PaymentStatusPayload,
		);

		expect(payment).toBeFalsy();
	});
});
