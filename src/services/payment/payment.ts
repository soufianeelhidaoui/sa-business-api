import { sendCustomer, sendPartner } from "@clients/email/email";
import { SmartPayClient } from "@clients/payment/smartpay";
import { getSecretForKVPS, hasPayment } from "@clients/secrets/secrets";
import {
	getOrderDetails,
	updateTerms as syliusUpdateTerms,
	updatePaymentStatus,
} from "@clients/sylius/sylius";
import config from "@config";
import { type IPaymentInfo, PaymentInfo } from "@schema/payment";
import getDealers from "@services/dealers/get-dealers";
import type { Brand } from "@ts-types/brand.t";
import type { Dealer } from "@ts-types/dealers.t";
import type { TemplateData } from "@ts-types/email.t";
import type {
	KVPSSecret,
	PaymentStatusPayload,
	SmartPayCheckoutType,
	SmartPayNotification,
} from "@ts-types/smartpay.t";
import { AxiosError, type AxiosResponse } from "axios";
import type { Logger } from "pino";

export const createCheckout = async (
	brand: Brand,
	kvps: string,
	payment: object,
) => {
	const smartPay = new SmartPayClient();

	if (!hasPayment(kvps)) {
		throw new Error(
			"can't create a checkout if given KVPS has no merchant key",
		);
	}

	const kvpsSecret = await getSecretForKVPS(kvps);
	const result: SmartPayCheckoutType = await smartPay.createCheckout(
		kvpsSecret as KVPSSecret,
		payment,
	);

	const savedPayment = await PaymentInfo.create({
		brand: brand,
		kvps: kvps,
		transactionId: result.transactionId,
		orderId: payment.order.externalOrderReference,
		confirmationSent: false,
	});

	await savedPayment.save();

	return result;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const unlockPayment = async (logger: Logger, transactionId: string) => {
	logger.info(`unlocking payment for ${transactionId}`);
	return await PaymentInfo.findOneAndUpdate(
		{ transactionId: transactionId },
		{ locked: false },
		{ new: true },
	);
};

export const getAndLockPayment = async (
	logger: Logger,
	transactionId: string,
): Promise<IPaymentInfo | null> => {
	let savedPayment: IPaymentInfo | null = null;

	let nbRetry = 0;
	while (!savedPayment && nbRetry <= 5) {
		logger.debug(`trying to lock transaction ${transactionId}`);
		const paymentInfo = await PaymentInfo.findOneAndUpdate(
			{ transactionId: transactionId, locked: false },
			{ locked: true },
			{ new: true },
		);

		if (!paymentInfo) {
			nbRetry++;
			logger.debug(`lock for ${transactionId} failed, sleeping...`);
			await delay(500);
		} else {
			logger.info(`lock for ${transactionId} acquired`);
			savedPayment = paymentInfo;
		}
	}

	if (!savedPayment) {
		logger.debug(`failed to acquire lock for ${transactionId}`);
	}

	return savedPayment;
};

const sendNotificationEmails = async (
	logger: Logger,
	savedPayment: IPaymentInfo,
) => {
	if (savedPayment.confirmationSent) {
		return;
	}

	logger.info(
		`sending confirmation for order ${savedPayment.orderId} on ${savedPayment.brand}`,
	);
	const orderDetails: AxiosResponse = await getOrderDetails(
		savedPayment.brand,
		savedPayment.kvps,
		savedPayment.orderId,
	);
	const dealers = await getDealers(savedPayment.brand);
	const dealer: Dealer | undefined = dealers.find(
		(dealer: Dealer) => dealer.kvps === savedPayment.kvps,
	);

	const fromAddress = config.get(
		`VITE_${savedPayment.brand.toUpperCase()}_FROM_ADDRESS`,
	);
	const fromAddressArn = config.get(
		`VITE_${savedPayment.brand.toUpperCase()}_FROM_ADDRESS_ARN`,
	);

	if (fromAddress !== "" || fromAddressArn !== "") {
		await sendCustomer({
			config: {
				fromAddress: fromAddress,
				fromAddressARN: fromAddressArn,
			},
			template: {
				name: "approved",
				data: {
					brand: savedPayment.brand,
					partner: dealer as Dealer,
					orderDetails: orderDetails.data,
				} as TemplateData,
			},
		});

		logger.info("sending notification email to partner");
		const secret = await getSecretForKVPS(savedPayment.kvps);
		if (secret) {
			await sendPartner({
				config: {
					fromAddress: fromAddress,
					fromAddressARN: fromAddressArn,
				},
				template: {
					name: "dealer-notification",
					data: {
						brand: savedPayment.brand,
						partner: dealer as Dealer,
						referent: {
							firstName: secret.firstName,
							lastName: secret.lastName,
							email: secret.email,
						},
						orderDetails: orderDetails.data,
					} as TemplateData,
				},
			});
		}
	}

	savedPayment.confirmationSent = true;
	return await savedPayment.save();
};

export const shouldCaptureOrRefund = async (
	logger: Logger,
	savedPayment: IPaymentInfo,
	paymentStatus: PaymentStatusPayload,
): Promise<boolean> => {
	if (paymentStatus.paymentStatus === "CAPTURED" && !savedPayment.captured) {
		logger.info(`payment ${savedPayment.transactionId} has been captured`);
		return true;
	}

	if (paymentStatus.paymentStatus === "REFUNDED" && !savedPayment.refund) {
		logger.info(`payment ${savedPayment.transactionId} is refunded`);
		return true;
	}

	return false;
};

const _updatePayment = async (logger: Logger, savedPayment: IPaymentInfo) => {
	const paymentStatus = await getPaymentStatus(savedPayment);
	const should = await shouldCaptureOrRefund(
		logger,
		savedPayment,
		paymentStatus,
	);

	if (!should) {
		return null;
	}

	logger.info(
		`updating payment on ${savedPayment.brand} for order ${savedPayment.transactionId}`,
	);

	let result: AxiosResponse;
	try {
		result = await updatePaymentStatus(savedPayment.brand, {
			eventType: "status.updated",
			objectId: savedPayment.transactionId, // Sylius uses transaction ID in the details field of the table.
			paymentStatus:
				paymentStatus.paymentStatus === "REFUNDED" ? "REFUNDED" : "CAPTURED",
		});
		savedPayment.captured = paymentStatus.paymentStatus === "CAPTURED";
		savedPayment.refund = paymentStatus.paymentStatus === "REFUNDED";
		savedPayment.needsReconciliation = false;
	} catch (err: unknown) {
		// Any time we have an issue while updating payment on Sylius side, we consider that we need to reconcile the payment.
		if (err instanceof AxiosError) {
			const axiosError = err as AxiosError;
			// Except if the error state that the payment is already in paid state on Sylius side.
			const isAlreadyCapturedInSylius =
				axiosError.response?.data.message.includes(
					'Transition "pay" cannot be applied on state "paid"',
				);
			savedPayment.captured = isAlreadyCapturedInSylius;
			// Only reconcile if the state in Sylius does not match the expected one.
			savedPayment.needsReconciliation = !isAlreadyCapturedInSylius;
		} else {
			// Any other error, we consider we need to reconcile
			savedPayment.needsReconciliation = true;
			savedPayment.captured = false;
		}
		await savedPayment.save();
		// Since we had an issue, no matter which one, we throw again the error (fail fast mode), to avoid any other work (sending email for example).
		throw err;
	}

	try {
		await sendNotificationEmails(logger, await savedPayment.save());
	} catch (err: unknown) {
		logger.error(err, "an error occured while sending notification emails");
	}

	logger.info("payment updated sucessfully");

	return result;
};

export const updatePayment = async (
	logger: Logger,
	payload: SmartPayNotification,
) => {
	let result: unknown = null;
	let savedPayment: IPaymentInfo | null = null;
	try {
		savedPayment = await getAndLockPayment(logger, payload.objectId);
		if (savedPayment) {
			result = await _updatePayment(logger, savedPayment);
		}
	} catch (err: unknown) {
		if (err instanceof AxiosError) {
			const axiosError = err as AxiosError;
			logger.error(
				{ message: axiosError.message, content: axiosError.response?.data },
				"failed to update payment status on Sylius instance",
			);
		} else {
			logger.error(err, "an unkown error occured while updating payment");
		}
	} finally {
		if (savedPayment) {
			await unlockPayment(logger, payload.objectId);
		}
	}

	return result;
};

export const updateTerms = async (
	brand: Brand,
	kvps: string,
	payload: unknown,
) => {
	const result = await syliusUpdateTerms(brand, kvps, payload);

	return result;
};

export const getPaymentStatus = async (
	savedPayment: IPaymentInfo,
): Promise<PaymentStatusPayload> => {
	const smartpay = new SmartPayClient();

	const credentials = await getSecretForKVPS(savedPayment.kvps);

	if (!credentials) {
		throw new Error("could not find secret for this payment");
	}

	const paymentStatus = await smartpay.getPaymentStatus(
		credentials,
		savedPayment.transactionId,
	);

	return paymentStatus;
};
